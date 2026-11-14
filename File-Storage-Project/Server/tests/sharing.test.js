// Sharing privacy tests (audit findings M6 and M7).
//
// MongoDB models, Redis and Backblaze B2 are replaced with in-memory fakes via
// mock.module, so no real MongoDB / Redis / B2 is ever contacted. Requests go
// through the real routes, the real checkAuth middleware (signed `sid` cookie
// + Redis session), the real rate limiter and the real controllers over HTTP.
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
const Share = createFakeModel('Share', {
  defaults: { seenAt: null, resourceType: 'file' },
  refs: { resourceId: 'File', ownerId: 'User', sharedWithUserId: 'User' },
});
const others = ['Subscription', 'Payment', 'FileInsight', 'Workspace', 'WorkspaceFile',
  'WorkspaceVisit', 'WorkspaceFolder', 'WorkspaceActivity'].map((n) => [n, createFakeModel(n)]);
const ALL_MODELS = [User, Directory, File, Share, ...others.map(([, m]) => m)];

const model = (path, fake) => mock.module(import.meta.resolve(path), { defaultExport: fake });
model('../models/userModel.js', User);
model('../models/directoryModel.js', Directory);
model('../models/fileModel.js', File);
model('../models/shareModel.js', Share);
for (const [name, fake] of others) {
  model(`../models/${name[0].toLowerCase()}${name.slice(1)}Model.js`, fake);
}
mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });
mock.module(import.meta.resolve('../config/b2.js'), {
  defaultExport: s3,
  namedExports: { BUCKET_NAME: 'test-bucket' },
});
mock.module(import.meta.resolve('../services/sendOtpService.js'), {
  namedExports: { sendOtpEmail: async () => ({ success: true, message: 'sent' }) },
});
mock.module(import.meta.resolve('../ai/insightService.js'), {
  namedExports: { deleteInsightsForFiles: async () => {}, deleteInsightsForUser: async () => {} },
});
mock.module(import.meta.resolve('../services/subscriptionService.js'), {
  namedExports: { expireIfDue: async () => {} },
});

const { default: userRoutes } = await import('../routes/userRoutes.js');
const { default: shareRoutes } = await import('../routes/shareRoutes.js');
const { default: checkAuth } = await import('../middlewares/authMiddleware.js');
const { getFileAccess } = await import('../utils/fileAccess.js');

// ------------------------------------------------------------ test harness

let server;
let base;
before(async () => {
  const app = express();
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json());
  app.use('/', userRoutes);
  app.use('/share', checkAuth, shareRoutes);
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

const sign = (val) =>
  `s:${val}.${crypto.createHmac('sha256', COOKIE_SECRET).update(val).digest('base64').replace(/=+$/, '')}`;

async function seedUser(name, { isDeleted = false } = {}) {
  const _id = new ObjectId();
  const rootDirId = new ObjectId();
  const email = `${name}@example.com`;
  User.insert({ _id, name, email, role: 'User', isDeleted, rootDirId });
  Directory.insert({ _id: rootDirId, name: `root-${_id}`, userId: _id, path: [rootDirId] });
  const sid = crypto.randomUUID();
  await redis.json.set(`session:${sid}`, '$', {
    userId: String(_id),
    rootDirId: String(rootDirId),
    role: 'User',
    maxStorageInBytes: 1024,
  });
  return { _id, id: String(_id), rootDirId, sid, email };
}

async function get(actor, path) {
  const res = await fetch(base + path, {
    headers: { Cookie: `sid=${encodeURIComponent(sign(actor.sid))}` },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const search = (actor, q) => get(actor, `/users/search?q=${encodeURIComponent(q)}`);

// ============================================================ M6: enumeration

test('M6: email prefixes and partial addresses reveal nothing', async () => {
  const me = await seedUser('mallory');
  await seedUser('alice');
  await seedUser('alicia');
  for (const q of ['ali', 'alic', 'alice', 'alice@', 'alice@exa', 'alice@example', 'a', '@example.com']) {
    const res = await search(me, q);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, [], `"${q}" must not list anyone`);
  }
});

test('M6: regex metacharacters are not a wildcard', async () => {
  const me = await seedUser('mallory');
  await seedUser('alice');
  for (const q of ['.*@example.com', 'a.*@example.com', '^alice@example.com', 'alice@example.c.m', '[a-z]+@example.com']) {
    assert.deepEqual((await search(me, q)).body, [], q);
  }
});

test('M6: only the complete address finds the account (case-insensitive)', async () => {
  const me = await seedUser('mallory');
  const alice = await seedUser('alice');
  await seedUser('alicia');
  for (const q of ['alice@example.com', '  ALICE@Example.COM ']) {
    const res = await search(me, q);
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1, q);
    assert.equal(res.body[0]._id, alice.id);
    assert.equal(res.body[0].email, 'alice@example.com');
  }
});

test('M6: deleted accounts and the caller themself are never returned', async () => {
  const me = await seedUser('mallory');
  await seedUser('ghost', { isDeleted: true });
  assert.deepEqual((await search(me, 'ghost@example.com')).body, []);
  assert.deepEqual((await search(me, me.email)).body, []);
});

test('M6: lookups are rate limited per account', async () => {
  const me = await seedUser('mallory');
  const other = await seedUser('olivia');
  for (let i = 0; i < 60; i++) {
    assert.equal((await search(me, `guess${i}@example.com`)).status, 200);
  }
  const blocked = await search(me, 'guess-final@example.com');
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Too many searches/);
  // The counter is in Redis (M5) and per account, not global.
  assert.ok(redis.keys('rl:user-search:').length >= 1);
  assert.equal((await search(other, 'mallory@example.com')).status, 200);
});

// ==================================== M7: shared files of soft-deleted owners

async function seedShare(owner, recipient, name = 'report.pdf') {
  const file = File.insert({
    name, extension: '.pdf', size: 10, userId: owner._id, parentDirId: owner.rootDirId,
  });
  Share.insert({
    resourceId: file._id, ownerId: owner._id, sharedWithUserId: recipient._id, permission: 'editor',
  });
  return file;
}
const setDeleted = (user, isDeleted) =>
  User.updateOne({ _id: user._id }, { $set: { isDeleted } });

test('M7: a soft-deleted owner\'s shared files can no longer be opened by recipients', async () => {
  const owner = await seedUser('olga');
  const bob = await seedUser('bob');
  const file = await seedShare(owner, bob);

  assert.equal((await getFileAccess(file._id, bob._id))?.role, 'editor', 'control: shared access works');
  await setDeleted(owner, true);
  assert.equal(await getFileAccess(file._id, bob._id), null, 'no access while the owner is deleted');
});

test('M7: "Shared with me" and notifications hide files of soft-deleted owners only', async () => {
  const owner = await seedUser('olga');
  const active = await seedUser('anna');
  const bob = await seedUser('bob');
  await seedShare(owner, bob, 'from-deleted.pdf');
  await seedShare(active, bob, 'from-active.pdf');

  const names = async () => (await get(bob, '/share/with-me')).body.map((s) => s.file.name).sort();
  const notified = async () =>
    (await get(bob, '/share/notifications')).body.notifications.map((n) => n.file.name).sort();
  assert.deepEqual(await names(), ['from-active.pdf', 'from-deleted.pdf']);
  assert.deepEqual(await notified(), ['from-active.pdf', 'from-deleted.pdf']);

  await setDeleted(owner, true);
  assert.deepEqual(await names(), ['from-active.pdf']);
  assert.deepEqual(await notified(), ['from-active.pdf']);
  assert.equal((await get(bob, '/share/notifications')).body.unreadCount, 1);
});

test('M7: the shares are kept, so recovering the owner restores access exactly', async () => {
  const owner = await seedUser('olga');
  const bob = await seedUser('bob');
  const file = await seedShare(owner, bob);

  await setDeleted(owner, true);
  assert.equal(Share.docs.size, 1, 'soft delete must not destroy share rows');
  await setDeleted(owner, false);
  assert.equal((await getFileAccess(file._id, bob._id))?.role, 'editor');
  assert.deepEqual((await get(bob, '/share/with-me')).body.map((s) => s.permission), ['editor']);
});

test('M7: the owner\'s own access is not changed by the check', async () => {
  const owner = await seedUser('olga');
  const bob = await seedUser('bob');
  const file = await seedShare(owner, bob);
  assert.equal((await getFileAccess(file._id, owner._id))?.role, 'owner');
});
