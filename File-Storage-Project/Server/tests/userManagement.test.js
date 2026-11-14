// User-management security tests (audit findings H4 and M2).
//
// MongoDB models, Redis, Backblaze B2, the mailer and the AI cleanup are
// replaced with in-memory fakes via mock.module, so no real MongoDB / Redis /
// B2 is ever contacted. Requests go through the real routes, the real
// checkAuth middleware (signed `sid` cookie + Redis session) and the real
// controllers over HTTP.
import { after, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { createFakeModel } from './helpers/fakeMongo.js';
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
const File = createFakeModel('File', { defaults: { isTrashed: false } });
const Share = createFakeModel('Share');
const Subscription = createFakeModel('Subscription');
const Payment = createFakeModel('Payment');
const FileInsight = createFakeModel('FileInsight');
const Workspace = createFakeModel('Workspace', {
  defaults: { status: 'active', members: [], size: 0, cleanup: { attempts: 0, lockedUntil: null } },
});
const WorkspaceFile = createFakeModel('WorkspaceFile');
const WorkspaceVisit = createFakeModel('WorkspaceVisit');
const WorkspaceFolder = createFakeModel('WorkspaceFolder');
const WorkspaceActivity = createFakeModel('WorkspaceActivity');
const ALL_MODELS = [
  User, Directory, File, Share, Subscription, Payment, FileInsight,
  Workspace, WorkspaceFile, WorkspaceVisit, WorkspaceFolder, WorkspaceActivity,
];

const model = (path, fake) => mock.module(import.meta.resolve(path), { defaultExport: fake });
model('../models/userModel.js', User);
model('../models/directoryModel.js', Directory);
model('../models/fileModel.js', File);
model('../models/shareModel.js', Share);
model('../models/subscriptionModel.js', Subscription);
model('../models/paymentModel.js', Payment);
model('../models/workspaceModel.js', Workspace);
model('../models/workspaceFileModel.js', WorkspaceFile);
model('../models/workspaceVisitModel.js', WorkspaceVisit);
model('../models/workspaceFolderModel.js', WorkspaceFolder);
model('../models/workspaceActivityModel.js', WorkspaceActivity);
mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });
mock.module(import.meta.resolve('../config/b2.js'), {
  defaultExport: s3,
  namedExports: { BUCKET_NAME: 'test-bucket' },
});
mock.module(import.meta.resolve('../services/sendOtpService.js'), {
  namedExports: { sendOtpEmail: async () => ({ success: true, message: 'sent' }) },
});
mock.module(import.meta.resolve('../ai/insightService.js'), {
  namedExports: {
    deleteInsightsForFiles: async (ids) => FileInsight.deleteMany({ fileId: { $in: ids } }),
    deleteInsightsForUser: async (userId) => FileInsight.deleteMany({ userId }),
  },
});
mock.module(import.meta.resolve('../services/subscriptionService.js'), {
  namedExports: { expireIfDue: async () => {} },
});

const { default: userRoutes } = await import('../routes/userRoutes.js');
const { purgeLockKey, purgeMarkerKey } = await import('../services/userPurgeService.js');
const { outranks, canAssignRole } = await import('../utils/roles.js');

// ------------------------------------------------------------ test harness

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
});

// Same format cookie-parser / cookie-signature produce.
const sign = (val) =>
  `s:${val}.${crypto.createHmac('sha256', COOKIE_SECRET).update(val).digest('base64').replace(/=+$/, '')}`;

/** Seeds a user with a root directory and an active session; returns helpers. */
async function seedUser(role, { isDeleted = false, email } = {}) {
  const _id = new ObjectId();
  const rootDirId = new ObjectId();
  User.insert({
    _id,
    name: `${role} person`,
    email: email || `${role.toLowerCase()}-${_id}@example.com`,
    role,
    isDeleted,
    rootDirId,
  });
  Directory.insert({ _id: rootDirId, name: `root-${_id}`, userId: _id, path: [rootDirId] });
  const sid = crypto.randomUUID();
  await redis.json.set(`session:${sid}`, '$', {
    userId: String(_id),
    rootDirId: String(rootDirId),
    role,
    maxStorageInBytes: 1024,
  });
  return { _id, id: String(_id), rootDirId, sid, role };
}

async function call(actor, method, path, body) {
  const headers = { Cookie: `sid=${encodeURIComponent(sign(actor.sid))}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, body: json };
}

const sessionsOf = (userId) =>
  redis.keys('session:').filter((k) => String(redis.rawGet(k).userId) === String(userId));

// ================================================================ M2

const ROLES = ['Owner', 'Admin', 'Manager', 'User'];

// Written out by hand (not derived from utils/roles.js) so the tests check
// the policy rather than re-run the implementation.
const EXPECT_SOFT_DELETE = {
  Owner: { Owner: false, Admin: true, Manager: true, User: true },
  Admin: { Owner: false, Admin: false, Manager: true, User: true },
  Manager: { Owner: false, Admin: false, Manager: false, User: false },
  User: { Owner: false, Admin: false, Manager: false, User: false },
};
const EXPECT_LOGOUT = {
  Owner: { Owner: false, Admin: true, Manager: true, User: true },
  Admin: { Owner: false, Admin: false, Manager: true, User: true },
  Manager: { Owner: false, Admin: false, Manager: false, User: true },
  User: { Owner: false, Admin: false, Manager: false, User: false },
};
// New role: a User target is promoted to Manager, anyone else is set to User.
const newRoleFor = (target) => (target === 'User' ? 'Manager' : 'User');
const EXPECT_ROLE_CHANGE = {
  Owner: { Owner: false, Admin: true, Manager: true, User: true },
  Admin: { Owner: false, Admin: false, Manager: true, User: true },
  Manager: { Owner: false, Admin: false, Manager: false, User: false },
  User: { Owner: false, Admin: false, Manager: false, User: false },
};

for (const actorRole of ROLES) {
  for (const targetRole of ROLES) {
    test(`M2: ${actorRole} -> ${targetRole}: soft delete, logout and role change follow strict rank`, async () => {
      // Soft delete
      {
        const actor = await seedUser(actorRole);
        const target = await seedUser(targetRole);
        const r = await call(actor, 'DELETE', `/users/${target.id}`);
        const allowed = EXPECT_SOFT_DELETE[actorRole][targetRole];
        assert.equal(r.status, allowed ? 204 : 403, `delete status ${JSON.stringify(r.body)}`);
        assert.equal(User.get(target._id).isDeleted, allowed);
        assert.equal(sessionsOf(target._id).length, allowed ? 0 : 1);
      }
      // Logout by id
      {
        const actor = await seedUser(actorRole);
        const target = await seedUser(targetRole);
        const r = await call(actor, 'POST', `/users/${target.id}/logout`);
        const allowed = EXPECT_LOGOUT[actorRole][targetRole];
        assert.equal(r.status, allowed ? 204 : 403, `logout status ${JSON.stringify(r.body)}`);
        assert.equal(sessionsOf(target._id).length, allowed ? 0 : 1);
      }
      // Role change
      {
        const actor = await seedUser(actorRole);
        const target = await seedUser(targetRole);
        const role = newRoleFor(targetRole);
        const r = await call(actor, 'PATCH', `/users/${target.id}/role`, { role });
        const allowed = EXPECT_ROLE_CHANGE[actorRole][targetRole];
        assert.equal(r.status, allowed ? 204 : 403, `role status ${JSON.stringify(r.body)}`);
        assert.equal(User.get(target._id).role, allowed ? role : targetRole);
      }
    });
  }
}

test('M2: nobody can assign a role at or above their own (privilege escalation)', async () => {
  const admin = await seedUser('Admin');
  const manager = await seedUser('Manager');
  const u1 = await seedUser('User');

  for (const role of ['Admin', 'Owner']) {
    const r = await call(admin, 'PATCH', `/users/${u1.id}/role`, { role });
    assert.equal(r.status, 403, `Admin must not grant ${role}`);
  }
  const r = await call(manager, 'PATCH', `/users/${u1.id}/role`, { role: 'Manager' });
  assert.equal(r.status, 403, 'Manager must not create another Manager');
  assert.equal(User.get(u1._id).role, 'User');

  // Admin may still promote a User to Manager (strictly below Admin).
  const ok = await call(admin, 'PATCH', `/users/${u1.id}/role`, { role: 'Manager' });
  assert.equal(ok.status, 204);
  assert.equal(User.get(u1._id).role, 'Manager');
});

test('M2: Owner privileges are preserved (can promote to Admin and appoint an Owner)', async () => {
  const owner = await seedUser('Owner');
  const u = await seedUser('User');
  assert.equal((await call(owner, 'PATCH', `/users/${u.id}/role`, { role: 'Admin' })).status, 204);
  assert.equal(User.get(u._id).role, 'Admin');
  assert.equal((await call(owner, 'PATCH', `/users/${u.id}/role`, { role: 'Owner' })).status, 204);
  assert.equal(User.get(u._id).role, 'Owner');
  // ...but once they are an Owner, the first Owner can no longer touch them.
  assert.equal((await call(owner, 'PATCH', `/users/${u.id}/role`, { role: 'User' })).status, 403);
  assert.equal((await call(owner, 'DELETE', `/users/${u.id}`)).status, 403);
  assert.equal(User.get(u._id).role, 'Owner');
});

test('M2: own role cannot be changed; prototype keys and unknown roles are rejected', async () => {
  const owner = await seedUser('Owner');
  const u = await seedUser('User');
  assert.equal((await call(owner, 'PATCH', `/users/${owner.id}/role`, { role: 'User' })).status, 403);
  for (const role of ['constructor', '__proto__', 'toString', 'SuperAdmin', '', 3, null]) {
    const r = await call(owner, 'PATCH', `/users/${u.id}/role`, { role });
    assert.equal(r.status, 400, `role ${JSON.stringify(role)} must be rejected`);
  }
  assert.equal(User.get(u._id).role, 'User');
});

test('M2: users can still end their own sessions via /users/:id/logout', async () => {
  const manager = await seedUser('Manager');
  assert.equal((await call(manager, 'POST', `/users/${manager.id}/logout`)).status, 204);
  assert.equal(sessionsOf(manager._id).length, 0);
});

test('M2: role helper rejects unknown roles on either side', () => {
  assert.equal(outranks('Owner', 'constructor'), false);
  assert.equal(outranks('constructor', 'User'), false);
  assert.equal(outranks('Admin', 'Admin'), false);
  assert.equal(outranks('Admin', 'Manager'), true);
  assert.equal(canAssignRole('Admin', 'Admin'), false);
  assert.equal(canAssignRole('Owner', 'Owner'), true);
  assert.equal(canAssignRole('Manager', '__proto__'), false);
});

// ================================================================ H4

/** A soft-deleted user with personal data in every place it can live. */
async function seedVictimWithData() {
  const victim = await seedUser('User', { isDeleted: true });
  const other = await seedUser('User');

  // Personal files (one nested in a sub-directory) and their B2 objects.
  const sub = Directory.insert({ name: 'docs', userId: victim._id, parentDirId: victim.rootDirId });
  const f1 = File.insert({ name: 'a.txt', extension: '.txt', size: 3, userId: victim._id, parentDirId: victim.rootDirId });
  const f2 = File.insert({ name: 'b.pdf', extension: '.pdf', size: 5, userId: victim._id, parentDirId: sub._id, isTrashed: true });
  s3.objects.set(`${f1._id}.txt`, Buffer.from('aaa'));
  s3.objects.set(`${f2._id}.pdf`, Buffer.from('bbbbb'));
  FileInsight.insert({ fileId: f1._id, userId: victim._id, status: 'done' });

  // An upload that was still in flight when the account was deleted.
  const pendingKey = `${new ObjectId()}.bin`;
  s3.objects.set(pendingKey, Buffer.from('partial'));
  Directory.docs.get(String(victim.rootDirId)).pendingUploads = [
    { id: 'u1', bytes: 7, fileId: null, objectKey: pendingKey, uploadId: null, at: new Date() },
  ];

  // Avatars: the current one and an orphan from an earlier replacement.
  const avatar = `avatars/${victim.id}/current.webp`;
  s3.objects.set(avatar, Buffer.from('img'));
  s3.objects.set(`avatars/${victim.id}/old.webp`, Buffer.from('old'));
  User.docs.get(victim.id).picture = avatar;

  // Shares: victim's file shared out, and someone's file shared with the victim.
  const otherFile = File.insert({ name: 'o.txt', extension: '.txt', size: 1, userId: other._id, parentDirId: other.rootDirId });
  s3.objects.set(`${otherFile._id}.txt`, Buffer.from('o'));
  s3.objects.set(`avatars/${other.id}/me.webp`, Buffer.from('other-avatar'));
  Share.insert({ resourceId: f1._id, ownerId: victim._id, sharedWithUserId: other._id, permission: 'viewer' });
  const keptShare = Share.insert({ resourceId: otherFile._id, ownerId: other._id, sharedWithUserId: victim._id, permission: 'viewer' });
  const othersShare = Share.insert({ resourceId: otherFile._id, ownerId: other._id, sharedWithUserId: new ObjectId(), permission: 'viewer' });
  FileInsight.insert({ fileId: otherFile._id, userId: other._id, status: 'done' });

  // Billing: subscription (entitlement) and a payment (financial record).
  Subscription.insert({ userId: victim._id, status: 'active', expiresAt: new Date(Date.now() + 1e9) });
  const payment = Payment.insert({ userId: victim._id, razorpayOrderId: 'order_1', status: 'paid', amount: 9900 });

  // Workspaces: one owned with nobody to inherit it, one owned with an editor
  // who takes it over, one owned by someone else where the victim is a member.
  const lonely = Workspace.insert({ name: 'lonely', ownerId: victim._id, members: [] });
  const lonelyFile = WorkspaceFile.insert({ workspaceId: lonely._id, extension: '.png', size: 2, uploadedBy: victim._id, isReady: true });
  s3.objects.set(`workspaces/${lonely._id}/${lonelyFile._id}.png`, Buffer.from('ws'));
  WorkspaceFolder.insert({ workspaceId: lonely._id, name: 'f', createdBy: victim._id });

  const shared = Workspace.insert({
    name: 'shared',
    ownerId: victim._id,
    members: [{ userId: other._id, role: 'editor', status: 'active', addedAt: new Date() }],
  });
  const sharedFile = WorkspaceFile.insert({ workspaceId: shared._id, extension: '.txt', size: 1, uploadedBy: other._id, isReady: true });
  s3.objects.set(`workspaces/${shared._id}/${sharedFile._id}.txt`, Buffer.from('keep'));

  const foreign = Workspace.insert({
    name: 'foreign',
    ownerId: other._id,
    members: [{ userId: victim._id, role: 'viewer', status: 'active', addedAt: new Date() }],
  });
  WorkspaceVisit.insert({ workspaceId: foreign._id, userId: victim._id, lastSeenAt: new Date() });
  WorkspaceVisit.insert({ workspaceId: foreign._id, userId: other._id, lastSeenAt: new Date() });

  return { victim, other, otherFile, keptShare, othersShare, payment, lonely, shared, sharedFile, foreign };
}

function assertVictimGone(d) {
  const vid = d.victim.id;
  assert.equal(User.get(d.victim._id), null, 'user document removed');
  assert.equal([...File.docs.values()].filter((f) => String(f.userId) === vid).length, 0, 'files removed');
  assert.equal([...Directory.docs.values()].filter((x) => String(x.userId) === vid).length, 0, 'directories removed');
  assert.equal([...FileInsight.docs.values()].filter((x) => String(x.userId) === vid).length, 0, 'insights removed');
  assert.equal(
    [...Share.docs.values()].filter((s) => String(s.ownerId) === vid || String(s.sharedWithUserId) === vid).length,
    0,
    'shares from and to the user removed',
  );
  assert.equal([...Subscription.docs.values()].length, 0, 'subscription removed');
  assert.equal([...WorkspaceVisit.docs.values()].filter((v) => String(v.userId) === vid).length, 0);
  // Only the other user's objects remain in B2.
  const keys = [...s3.objects.keys()].sort();
  assert.deepEqual(
    keys,
    [
      `${d.otherFile._id}.txt`,
      `avatars/${d.other.id}/me.webp`,
      `workspaces/${d.shared._id}/${d.sharedFile._id}.txt`,
    ].sort(),
    'no object of the purged user is left, and nobody else lost any',
  );
  assert.equal(sessionsOf(d.victim._id).length, 0, 'sessions removed');
  assert.equal(redis.rawGet(purgeMarkerKey(vid)), undefined, 'purge marker cleared');
  assert.equal(redis.rawGet(purgeLockKey(vid)), undefined, 'lock released');
}

function assertOthersIntact(d) {
  assert.ok(User.get(d.other._id), 'other user kept');
  assert.ok(File.get(d.otherFile._id), "other user's file kept");
  assert.ok(Share.get(d.othersShare._id), "other user's unrelated share kept");
  assert.equal(Share.get(d.keptShare._id), null, 'share TO the purged user removed');
  assert.ok(Payment.get(d.payment._id), 'payment record retained');
  assert.equal(Payment.get(d.payment._id).amount, 9900);

  assert.equal(Workspace.get(d.lonely._id), null, 'workspace with no heir purged and removed');
  assert.equal([...WorkspaceFile.docs.values()].filter((f) => String(f.workspaceId) === String(d.lonely._id)).length, 0);
  assert.equal([...WorkspaceFolder.docs.values()].length, 0);

  const shared = Workspace.get(d.shared._id);
  assert.ok(shared, 'workspace with an eligible member is kept');
  assert.equal(String(shared.ownerId), d.other.id, 'ownership handed to the editor');
  assert.ok(WorkspaceFile.get(d.sharedFile._id), "other member's workspace file kept");

  const foreign = Workspace.get(d.foreign._id);
  assert.equal(foreign.members.some((m) => String(m.userId) === d.victim.id), false, 'membership removed');
  assert.equal([...WorkspaceVisit.docs.values()].length, 1, "other user's visit kept");
}

test('H4: Owner permanently deletes a soft-deleted user and every trace of their data', async () => {
  const owner = await seedUser('Owner');
  const d = await seedVictimWithData();

  const r = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(r.status, 204, JSON.stringify(r.body));
  assertVictimGone(d);
  assertOthersIntact(d);
});

test('H4: permanent deletion is Owner-only (Admin is refused, nothing is removed)', async () => {
  const admin = await seedUser('Admin');
  const d = await seedVictimWithData();
  const r = await call(admin, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(r.status, 403);
  assert.ok(User.get(d.victim._id));
  assert.ok(s3.objects.size >= 8);
});

test('H4: an active (not soft-deleted) user cannot be permanently deleted', async () => {
  const owner = await seedUser('Owner');
  const target = await seedUser('User');
  const f = File.insert({ name: 'x', extension: '.txt', size: 1, userId: target._id, parentDirId: target.rootDirId });
  s3.objects.set(`${f._id}.txt`, Buffer.from('x'));

  const r = await call(owner, 'DELETE', `/users/${target.id}/hard`);
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'NOT_SOFT_DELETED');
  assert.ok(User.get(target._id));
  assert.ok(File.get(f._id));
  assert.ok(s3.objects.has(`${f._id}.txt`));
  assert.equal(sessionsOf(target._id).length, 1);
});

test('H4: an Owner cannot permanently delete another Owner, nor themselves', async () => {
  const owner = await seedUser('Owner');
  const owner2 = await seedUser('Owner', { isDeleted: true });
  assert.equal((await call(owner, 'DELETE', `/users/${owner2.id}/hard`)).status, 403);
  assert.ok(User.get(owner2._id));
  assert.equal((await call(owner, 'DELETE', `/users/${owner.id}/hard`)).status, 403);
});

test('H4: a B2 failure is reported, blocks recovery, and a retry finishes the purge', async () => {
  const owner = await seedUser('Owner');
  const d = await seedVictimWithData();

  // Workspaces are handled first; B2 then fails while deleting personal files.
  s3.failDeletes = 1;
  s3.failDeleteWhen = (keys) => !keys[0].startsWith('workspaces/');
  const first = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(first.status, 500);
  assert.equal(first.body.code, 'PURGE_INCOMPLETE');

  // Nothing pretends to be done: the account still exists, soft-deleted.
  assert.ok(User.get(d.victim._id));
  assert.equal(User.get(d.victim._id).isDeleted, true);
  // Files whose objects could not be deleted are still tracked (no orphans).
  for (const f of [...File.docs.values()].filter((x) => String(x.userId) === d.victim.id)) {
    assert.ok(s3.objects.has(`${f._id}${f.extension}`), 'file doc kept only while its object exists');
  }
  // Recovering a half-deleted account is refused.
  const rec = await call(owner, 'PATCH', `/users/${d.victim.id}/recover`);
  assert.equal(rec.status, 409);
  assert.equal(rec.body.code, 'PURGE_IN_PROGRESS');
  assert.equal(User.get(d.victim._id).isDeleted, true);

  const retry = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(retry.status, 204, JSON.stringify(retry.body));
  assertVictimGone(d);
  assertOthersIntact(d);
});

test('H4: a failed workspace purge stops the account purge until it can finish', async () => {
  const owner = await seedUser('Owner');
  const d = await seedVictimWithData();

  s3.failDeletes = 1;
  s3.failDeleteWhen = (keys) => keys[0].startsWith('workspaces/');
  const first = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(first.status, 500);
  assert.equal(first.body.code, 'PURGE_INCOMPLETE');
  // Personal data and the user are untouched; the workspace still exists.
  assert.ok(User.get(d.victim._id));
  assert.ok(Workspace.get(d.lonely._id));
  assert.ok([...File.docs.values()].some((f) => String(f.userId) === d.victim.id));

  // The workspace purge lease (5 minutes) has to run out before a retry.
  Workspace.docs.get(String(d.lonely._id)).cleanup.lockedUntil = new Date(Date.now() - 1);
  const retry = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(retry.status, 204, JSON.stringify(retry.body));
  assertVictimGone(d);
  assertOthersIntact(d);
});

test('H4: purge is idempotent and concurrent runs are locked out', async () => {
  const owner = await seedUser('Owner');
  const d = await seedVictimWithData();

  // Another purge holds the lock.
  await redis.set(purgeLockKey(d.victim.id), 'someone-else', { condition: 'NX' });
  const locked = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(locked.status, 409);
  assert.equal(locked.body.code, 'PURGE_IN_PROGRESS');
  assert.ok(User.get(d.victim._id));
  await redis.del(purgeLockKey(d.victim.id));

  const results = await Promise.all([
    call(owner, 'DELETE', `/users/${d.victim.id}/hard`),
    call(owner, 'DELETE', `/users/${d.victim.id}/hard`),
  ]);
  const statuses = results.map((r) => r.status).sort();
  // Exactly one run does the work; the other is locked out (409) or, if it
  // arrives after completion, finds nothing left (404).
  assert.equal(statuses.filter((s) => s === 204).length, 1, JSON.stringify(statuses));
  assert.ok([404, 409].includes(statuses.find((s) => s !== 204)));
  assertVictimGone(d);
  assertOthersIntact(d);

  // A repeat after completion changes nothing.
  const again = await call(owner, 'DELETE', `/users/${d.victim.id}/hard`);
  assert.equal(again.status, 404);
  assertOthersIntact(d);
});

test('H4: soft delete keeps data and can still be recovered', async () => {
  const owner = await seedUser('Owner');
  const target = await seedUser('User');
  const f = File.insert({ name: 'x', extension: '.txt', size: 1, userId: target._id, parentDirId: target.rootDirId });
  assert.equal((await call(owner, 'DELETE', `/users/${target.id}`)).status, 204);
  assert.ok(File.get(f._id));
  assert.equal((await call(owner, 'PATCH', `/users/${target.id}/recover`)).status, 204);
  assert.equal(User.get(target._id).isDeleted, false);
});
