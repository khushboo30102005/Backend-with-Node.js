// Initial Owner setup tests (services/ownerBootstrapService.js) plus
// regression tests that normal registration and the role-change endpoint can
// never produce an Owner.
//
// MongoDB models, Redis, B2, the mailer and transactions are in-memory fakes
// (mock.module); nothing real is contacted.
import { after, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { createFakeModel, createFakeTransactions } from './helpers/fakeMongo.js';
import { createFakeRedis } from './helpers/fakeRedis.js';
import { createFakeS3 } from './helpers/fakeS3.js';

const { ObjectId } = mongoose.Types;
const COOKIE_SECRET = 'test-only-cookie-secret';
process.env.OTP_SECRET = 'test-only-otp-secret';

const redis = createFakeRedis();
const { s3 } = createFakeS3();
const User = createFakeModel('User', {
  defaults: { role: 'User', isDeleted: false, picture: 'https://example.test/default.png' },
});
const Directory = createFakeModel('Directory', {
  defaults: { size: 0, isTrashed: false, parentDirId: null, path: [] },
  hidden: ['pendingUploads'],
});
const SystemState = createFakeModel('SystemState');
const AuditLog = createFakeModel('AuditLog');
const others = ['File', 'Share', 'Subscription', 'Payment', 'Workspace', 'WorkspaceFile',
  'WorkspaceVisit', 'WorkspaceFolder', 'WorkspaceActivity'].map((n) => createFakeModel(n));
const ALL_MODELS = [User, Directory, SystemState, AuditLog, ...others];

// userController.register uses insertOne with an explicit session.
for (const m of [User, Directory]) m.insertOne = (doc) => m.create(doc);
const fakeSession = {
  startTransaction() {},
  async commitTransaction() {},
  async abortTransaction() {},
  endSession() {},
};
mongoose.startSession = async () => fakeSession;

const tx = createFakeTransactions([User, Directory, SystemState, AuditLog]);

const model = (path, fake) => mock.module(import.meta.resolve(path), { defaultExport: fake });
model('../models/userModel.js', User);
model('../models/directoryModel.js', Directory);
model('../models/systemStateModel.js', SystemState);
model('../models/auditLogModel.js', AuditLog);
const otherPaths = ['fileModel', 'shareModel', 'subscriptionModel', 'paymentModel', 'workspaceModel',
  'workspaceFileModel', 'workspaceVisitModel', 'workspaceFolderModel', 'workspaceActivityModel'];
otherPaths.forEach((p, i) => model(`../models/${p}.js`, others[i]));
mock.module(import.meta.resolve('../utils/transaction.js'), {
  namedExports: { runInTransaction: tx.runInTransaction, resetTransactionSupport() {} },
});
mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });
mock.module(import.meta.resolve('../config/b2.js'), {
  defaultExport: s3,
  namedExports: { BUCKET_NAME: 'test-bucket' },
});
const outbox = [];
mock.module(import.meta.resolve('../services/sendOtpService.js'), {
  namedExports: {
    sendOtpEmail: async (email, otp) => {
      outbox.push({ email, otp });
      return { success: true, message: 'sent' };
    },
  },
});
mock.module(import.meta.resolve('../ai/insightService.js'), {
  namedExports: { deleteInsightsForFiles: async () => {}, deleteInsightsForUser: async () => {} },
});
mock.module(import.meta.resolve('../services/subscriptionService.js'), {
  namedExports: { expireIfDue: async () => {} },
});

const svc = await import('../services/ownerBootstrapService.js');
const { issueEmailOtp } = await import('../services/otpService.js');
const { default: userRoutes } = await import('../routes/userRoutes.js');

// ------------------------------------------------------------ harness

const TOKEN = 'correct-setup-token-0123456789abcdefghijklmnop';
const STRONG = 'Str0ng!Owner#Pass';
const CONTEXT = { source: 'cli', host: 'test-host', osUser: 'tester' };

let server;
let base;
before(async () => {
  const app = express();
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json());
  app.use('/', userRoutes);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong!!' });
  });
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

beforeEach(() => {
  for (const m of ALL_MODELS) m.reset();
  redis.flush();
  s3.reset();
  outbox.length = 0;
  process.env.OWNER_SETUP_TOKEN_HASH = svc.hashSetupToken(TOKEN);
});

const owners = () => [...User.docs.values()].filter((u) => u.role === 'Owner');
const audits = (type) => [...AuditLog.docs.values()].filter((a) => !type || a.type === type);
const marker = () => SystemState.get(svc.OWNER_BOOTSTRAP_ID);
const lastOtp = (email) => outbox.filter((m) => m.email === email).at(-1)?.otp;

/** Runs the full two-step setup the CLI performs. */
async function runSetup({ email = 'owner@example.com', name = 'First Owner', password = STRONG,
  setupToken = TOKEN, promoteExisting = false } = {}) {
  await svc.requestOwnerVerification({ setupToken, email, context: CONTEXT });
  return svc.initializeOwner({
    setupToken, name, email, password, otp: lastOtp(email.toLowerCase()), promoteExisting,
    context: CONTEXT,
  });
}

const rejectsWith = (promise, code) =>
  assert.rejects(promise, (err) => {
    assert.ok(err instanceof svc.OwnerSetupError, `expected OwnerSetupError, got ${err}`);
    assert.equal(err.code, code);
    return true;
  });

const sign = (val) =>
  `s:${val}.${crypto.createHmac('sha256', COOKIE_SECRET).update(val).digest('base64').replace(/=+$/, '')}`;

async function seedUser(role, { email, isDeleted = false } = {}) {
  const _id = new ObjectId();
  const rootDirId = new ObjectId();
  User.insert({ _id, name: `${role} person`, email: email || `${role.toLowerCase()}-${_id}@example.com`,
    role, isDeleted, rootDirId });
  Directory.insert({ _id: rootDirId, name: `root-${_id}`, userId: _id, path: [rootDirId] });
  const sid = crypto.randomUUID();
  await redis.json.set(`session:${sid}`, '$', {
    userId: String(_id), rootDirId: String(rootDirId), role, maxStorageInBytes: 1024,
  });
  return { _id, id: String(_id), sid, role };
}

async function http(method, path, body, actor) {
  const headers = {};
  if (actor) headers.Cookie = `sid=${encodeURIComponent(sign(actor.sid))}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, body: json };
}

// ================================================================ first Owner

test('first Owner is created with root directory, marker and audit entry', async () => {
  assert.deepEqual(await svc.getOwnerSetupStatus(), { available: true, reason: null });

  const result = await runSetup({ email: 'Owner@Example.com' });

  assert.equal(result.promoted, false);
  assert.equal(result.email, 'owner@example.com');
  const all = owners();
  assert.equal(all.length, 1);
  const owner = all[0];
  assert.equal(owner.email, 'owner@example.com');
  assert.equal(owner.name, 'First Owner');
  assert.equal(String(owner._id), String(result.ownerId));
  const dir = Directory.get(owner.rootDirId);
  assert.ok(dir, 'root directory exists');
  assert.equal(String(dir.userId), String(owner._id));

  assert.equal(String(marker().ownerId), String(owner._id));
  const [entry] = audits(svc.AUDIT_OWNER_INITIALIZED);
  assert.equal(entry.outcome, 'success');
  assert.equal(String(entry.targetUserId), String(owner._id));
  assert.equal(entry.targetEmail, 'owner@example.com');
  assert.equal(entry.source, 'cli');
  assert.equal(entry.host, 'test-host');
  assert.equal(entry.osUser, 'tester');
  assert.equal(tx.stats.committed >= 1, true, 'ran inside a transaction');

  assert.deepEqual(await svc.getOwnerSetupStatus(), { available: false, reason: 'completed' });
});

test('the OTP is single use and bound to the Owner email', async () => {
  await svc.requestOwnerVerification({ setupToken: TOKEN, email: 'owner@example.com', context: CONTEXT });
  const otp = lastOtp('owner@example.com');
  // An OTP issued for a different address is not accepted.
  const otherOtp = await issueEmailOtp('someone-else@example.com');
  await rejectsWith(
    svc.initializeOwner({ setupToken: TOKEN, name: 'First Owner', email: 'owner@example.com',
      password: STRONG, otp: otherOtp === otp ? '000000' : otherOtp, context: CONTEXT }),
    'INVALID_OTP',
  );
  await svc.initializeOwner({ setupToken: TOKEN, name: 'First Owner', email: 'owner@example.com',
    password: STRONG, otp, context: CONTEXT });
  assert.equal(owners().length, 1);
});

// ================================================================ duplicates

test('duplicate initialization is refused and audited; still exactly one Owner', async () => {
  await runSetup({ email: 'owner@example.com' });

  await rejectsWith(runSetup({ email: 'second@example.com' }), 'ALREADY_INITIALIZED');
  assert.equal(owners().length, 1);
  assert.equal(outbox.filter((m) => m.email === 'second@example.com').length, 0, 'no OTP sent');
  const denied = audits(svc.AUDIT_OWNER_DENIED);
  assert.equal(denied.length, 1);
  assert.match(denied[0].detail, /ALREADY_INITIALIZED/);
});

test('concurrent initializations: exactly one succeeds', async () => {
  await svc.requestOwnerVerification({ setupToken: TOKEN, email: 'a@example.com', context: CONTEXT });
  await svc.requestOwnerVerification({ setupToken: TOKEN, email: 'b@example.com', context: CONTEXT });
  const results = await Promise.allSettled(
    ['a@example.com', 'b@example.com'].map((email) =>
      svc.initializeOwner({ setupToken: TOKEN, name: 'Racing Owner', email, password: STRONG,
        otp: lastOtp(email), context: CONTEXT }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const failed = results.find((r) => r.status === 'rejected');
  assert.equal(failed.reason.code, 'ALREADY_INITIALIZED');
  assert.equal(owners().length, 1);
  assert.equal(audits(svc.AUDIT_OWNER_INITIALIZED).length, 1);
});

test('setup is closed (and sealed) when an Owner already exists', async () => {
  const existing = await seedUser('Owner');
  assert.equal((await svc.getOwnerSetupStatus()).reason, 'owner-exists');
  await rejectsWith(runSetup(), 'ALREADY_INITIALIZED');
  assert.equal(owners().length, 1);
  assert.equal(String(marker().ownerId), existing.id, 'marker written for the existing Owner');
});

test('setup stays disabled permanently, even if the Owner is later removed', async () => {
  const { ownerId } = await runSetup();
  User.docs.delete(String(ownerId)); // e.g. removed directly in the database
  assert.equal(owners().length, 0);
  assert.deepEqual(await svc.getOwnerSetupStatus(), { available: false, reason: 'completed' });
  await rejectsWith(runSetup({ email: 'attacker@example.com' }), 'ALREADY_INITIALIZED');
  assert.equal(owners().length, 0);
});

// ================================================================ unauthorized

test('wrong, missing or unconfigured setup token is refused before any OTP is sent', async () => {
  for (const setupToken of ['wrong-token', '', null, TOKEN.slice(0, -1), `${TOKEN} `]) {
    await rejectsWith(runSetup({ setupToken }), 'INVALID_TOKEN');
  }
  delete process.env.OWNER_SETUP_TOKEN_HASH;
  await rejectsWith(runSetup(), 'SETUP_DISABLED');
  process.env.OWNER_SETUP_TOKEN_HASH = 'not-a-sha256-hash';
  await rejectsWith(runSetup(), 'SETUP_DISABLED');
  // The plaintext token in the env var does not work either (hash only).
  process.env.OWNER_SETUP_TOKEN_HASH = TOKEN;
  await rejectsWith(runSetup(), 'SETUP_DISABLED');

  assert.equal(outbox.length, 0);
  assert.equal(owners().length, 0);
  assert.equal(marker(), null);
  assert.ok(audits(svc.AUDIT_OWNER_DENIED).length >= 5, 'denied attempts are audited');
});

test('token checks are repeated at creation time, not only when the OTP is sent', async () => {
  await svc.requestOwnerVerification({ setupToken: TOKEN, email: 'owner@example.com', context: CONTEXT });
  await rejectsWith(
    svc.initializeOwner({ setupToken: 'wrong', name: 'First Owner', email: 'owner@example.com',
      password: STRONG, otp: lastOtp('owner@example.com'), context: CONTEXT }),
    'INVALID_TOKEN',
  );
  assert.equal(owners().length, 0);
});

test('wrong or missing OTP creates nothing and locks after the attempt limit', async () => {
  await svc.requestOwnerVerification({ setupToken: TOKEN, email: 'owner@example.com', context: CONTEXT });
  const real = lastOtp('owner@example.com');
  const wrong = real === '123456' ? '654321' : '123456';
  const attempt = (otp) =>
    svc.initializeOwner({ setupToken: TOKEN, name: 'First Owner', email: 'owner@example.com',
      password: STRONG, otp, context: CONTEXT });
  await rejectsWith(attempt(undefined), 'INVALID_OTP');
  for (let i = 0; i < 5; i++) await rejectsWith(attempt(wrong), 'INVALID_OTP');
  await rejectsWith(attempt(real), 'INVALID_OTP'); // destroyed after 5 failures
  assert.equal(owners().length, 0);
  assert.equal(marker(), null);
  assert.equal((await svc.getOwnerSetupStatus()).available, true);
});

test('weak passwords and invalid details are rejected', async () => {
  for (const password of ['short1!A', 'alllowercase123!', 'ALLUPPERCASE123!', 'NoDigitsHere!!', 'NoSymbols12345', 'A1!' + 'a'.repeat(80)]) {
    assert.throws(() => svc.validateNewOwner({ name: 'Owner', email: 'o@example.com', password }),
      (e) => e.code === 'INVALID_INPUT', password);
  }
  assert.throws(() => svc.validateNewOwner({ name: '<b>x</b>', email: 'o@example.com', password: STRONG }),
    (e) => e.code === 'INVALID_INPUT');
  assert.throws(() => svc.validateNewOwner({ name: 'Owner', email: 'not-an-email', password: STRONG }),
    (e) => e.code === 'INVALID_INPUT');
  await rejectsWith(runSetup({ password: 'weakpass' }), 'INVALID_INPUT');
  assert.equal(owners().length, 0);
});

test('a failure part-way through rolls everything back and setup stays available', async () => {
  AuditLog.failNext('create', new Error('disk full'), (doc) => doc.outcome === 'success');
  await assert.rejects(runSetup(), /disk full/);
  assert.equal(owners().length, 0);
  assert.equal(User.docs.size, 0);
  assert.equal(Directory.docs.size, 0);
  assert.equal(marker(), null);
  assert.equal((await svc.getOwnerSetupStatus()).available, true);
});

// ================================================================ existing accounts

test('existing email is not taken over without --promote-existing', async () => {
  await seedUser('User', { email: 'me@example.com' });
  await rejectsWith(runSetup({ email: 'me@example.com' }), 'EMAIL_TAKEN');
  assert.equal(owners().length, 0);
});

test('--promote-existing promotes the verified account and ends its sessions', async () => {
  const me = await seedUser('Admin', { email: 'me@example.com' });
  const result = await runSetup({ email: 'me@example.com', promoteExisting: true, name: undefined, password: undefined });
  assert.equal(result.promoted, true);
  assert.equal(User.get(me._id).role, 'Owner');
  assert.equal(redis.keys('session:').length, 0, 'cached role sessions were ended');
  const [entry] = audits(svc.AUDIT_OWNER_INITIALIZED);
  assert.match(entry.detail, /Admin to Owner/);
  assert.equal(String(marker().ownerId), me.id);
});

test('a deleted account cannot be promoted to Owner', async () => {
  await seedUser('User', { email: 'gone@example.com', isDeleted: true });
  await rejectsWith(runSetup({ email: 'gone@example.com', promoteExisting: true }), 'ACCOUNT_DELETED');
  assert.equal(owners().length, 0);
});

// ================================================================ regression: no Owner via the API

test('normal registration never assigns the Owner role, even when requested', async () => {
  const email = 'newbie@example.com';
  const otp = await issueEmailOtp(email);
  const r = await http('POST', '/user/register', {
    name: 'New User', email, password: 'secret-pass', otp, role: 'Owner', isDeleted: false,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const created = [...User.docs.values()].find((u) => u.email === email);
  assert.equal(created.role, 'User');
  assert.equal(owners().length, 0);
  assert.equal(marker(), null, 'registration does not touch the setup marker');
});

test('Admins, Managers and Users cannot make themselves or anyone else an Owner', async () => {
  for (const role of ['Admin', 'Manager', 'User']) {
    const actor = await seedUser(role);
    const self = await http('PATCH', `/users/${actor.id}/role`, { role: 'Owner' }, actor);
    assert.equal(self.status, 403, `${role} self-promotion`);
    const victim = await seedUser('User');
    const other = await http('PATCH', `/users/${victim.id}/role`, { role: 'Owner' }, actor);
    assert.equal(other.status, 403, `${role} promoting someone else`);
    assert.equal(User.get(actor._id).role, role);
    assert.equal(User.get(victim._id).role, 'User');
  }
  assert.equal(owners().length, 0);
});

test('existing hierarchy is preserved: an Owner can still appoint another Owner', async () => {
  const owner = await seedUser('Owner');
  const u = await seedUser('User');
  const r = await http('PATCH', `/users/${u.id}/role`, { role: 'Owner' }, owner);
  assert.equal(r.status, 204);
  assert.equal(User.get(u._id).role, 'Owner');
});
