// Storage accounting and quota tests (audit findings H3 and M1).
//
// MongoDB models, B2 (S3 + lib-storage), the plan limit and the AI cleanup are
// replaced with in-memory fakes via mock.module, so no real MongoDB / Redis /
// Backblaze B2 is ever contacted. Requests go through the real Express routes
// and controllers over real HTTP, so streaming, disconnects and parallel
// requests behave as they do in production.
import { after, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import mongoose from 'mongoose';
import { createFakeModel } from './helpers/fakeMongo.js';
import { createFakeS3 } from './helpers/fakeS3.js';

const { ObjectId } = mongoose.Types;

const Directory = createFakeModel('Directory', {
  defaults: { size: 0, isTrashed: false, trashedAt: null, parentDirId: null, path: [] },
  hidden: ['pendingUploads'], // select: false in the real schema
});
const File = createFakeModel('File', { defaults: { isTrashed: false, trashedAt: null } });
const Share = createFakeModel('Share');
const Workspace = createFakeModel('Workspace');
const WorkspaceFile = createFakeModel('WorkspaceFile');
const WorkspaceActivity = createFakeModel('WorkspaceActivity');
const { s3, Upload } = createFakeS3();
const limits = new Map(); // userId -> storage limit in bytes

const model = (path, fake) => mock.module(import.meta.resolve(path), { defaultExport: fake });
model('../models/directoryModel.js', Directory);
model('../models/fileModel.js', File);
model('../models/shareModel.js', Share);
model('../models/workspaceModel.js', Workspace);
model('../models/workspaceFileModel.js', WorkspaceFile);
model('../models/workspaceActivityModel.js', WorkspaceActivity);
mock.module(import.meta.resolve('../config/b2.js'), {
  defaultExport: s3,
  namedExports: { BUCKET_NAME: 'test-bucket' },
});
mock.module('@aws-sdk/lib-storage', { namedExports: { Upload } });
mock.module(import.meta.resolve('../services/subscriptionService.js'), {
  namedExports: {
    getEffectiveStorageLimit: async (userId) => limits.get(String(userId)) ?? 0,
    expireIfDue: async () => {},
  },
});
mock.module(import.meta.resolve('../ai/insightService.js'), {
  namedExports: { deleteInsightsForFiles: async () => {}, deleteInsightsForUser: async () => {} },
});

const { default: fileRoutes } = await import('../routes/fileRoutes.js');
const { default: directoryRoutes } = await import('../routes/directoryRoutes.js');
const { default: workspaceRoutes } = await import('../routes/workspaceRoutes.js');
const quota = await import('../services/storageQuotaService.js');
const { updateDirectorySize } = await import('../utils/updateDirectorySize.js');

// ------------------------------------------------------------ test harness

const sessions = new Map(); // token -> req.user
let server;
let port;

before(async () => {
  const app = express();
  app.use((req, res, next) => {
    const user = sessions.get(req.headers['x-test-user']);
    if (!user) return res.status(401).json({ error: 'Not logged in!' });
    req.user = { ...user };
    next();
  });
  app.use(express.json());
  app.use('/file', fileRoutes);
  app.use('/directory', directoryRoutes);
  app.use('/workspace', workspaceRoutes);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(500).json({ error: 'Something went wrong!!' }));
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  port = server.address().port;
});

after(() => server.close());

beforeEach(() => {
  for (const m of [Directory, File, Share, Workspace, WorkspaceFile, WorkspaceActivity]) m.reset();
  s3.reset();
  sessions.clear();
  limits.clear();
});

function makeUser(limit) {
  const _id = new ObjectId();
  const rootId = new ObjectId();
  Directory.insert({ _id: rootId, name: `root-${_id}`, userId: _id, parentDirId: null, path: [rootId] });
  limits.set(String(_id), limit);
  const token = String(_id);
  sessions.set(token, { _id, rootDirId: rootId, role: 'User' });
  return { token, _id, rootId };
}

function makeDir(user, parentId, name) {
  const _id = new ObjectId();
  const parent = Directory.get(parentId);
  Directory.insert({ _id, name, userId: user._id, parentDirId: parentId, path: [...parent.path, _id] });
  return _id;
}

const bytes = (n, fill = 7) => Buffer.alloc(n, fill);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Raw HTTP so tests control Content-Length, chunking and disconnects.
function request(user, { method = 'POST', path, headers = {}, body, chunks, chunkDelayMs = 5, json }) {
  return new Promise((resolve, reject) => {
    const h = { 'x-test-user': user.token, ...headers };
    if (json !== undefined) {
      body = Buffer.from(JSON.stringify(json));
      h['content-type'] = 'application/json';
    }
    if (body !== undefined && h['content-length'] === undefined) h['content-length'] = body.length;
    const req = http.request({ host: '127.0.0.1', port, method, path, headers: h }, (res) => {
      const parts = [];
      res.on('data', (c) => parts.push(c));
      res.on('end', () => {
        const text = Buffer.concat(parts).toString();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (chunks) {
      (async () => {
        for (const c of chunks) {
          if (req.destroyed) return;
          req.write(c);
          await sleep(chunkDelayMs);
        }
        req.end();
      })();
    } else {
      req.end(body);
    }
  });
}

function upload(user, { dirId, data, filesize = data?.length, filename = 'file.bin', headers = {}, chunks }) {
  return request(user, {
    path: dirId ? `/file/${dirId}` : '/file',
    headers: {
      'content-type': 'application/octet-stream',
      filename,
      filesize: String(filesize),
      ...(chunks && { 'transfer-encoding': 'chunked' }),
      ...headers,
    },
    body: chunks ? undefined : data,
    chunks,
  });
}

const userFiles = (user) => [...File.docs.values()].filter((f) => String(f.userId) === String(user._id));
const pendingOf = (user) => Directory.get(user.rootId).pendingUploads ?? [];
const sizeOf = (dirId) => Directory.get(dirId).size;

async function eventually(check, timeoutMs = 3000) {
  const start = Date.now();
  for (;;) {
    try {
      return check();
    } catch (err) {
      if (Date.now() - start > timeoutMs) throw err;
      await sleep(20);
    }
  }
}

/**
 * The invariant every test ends with:
 *   - every directory's size is exactly the sum of the files beneath it
 *     (trashed files included: Trash keeps storage charged, by design);
 *   - every file has exactly one B2 object of exactly its recorded size;
 *   - there are no B2 objects without a file record (orphans);
 *   - no upload reservation is left behind and no size is negative.
 */
function assertAccounting(user) {
  const dirs = [...Directory.docs.values()].filter((d) => String(d.userId) === String(user._id));
  const expected = new Map(dirs.map((d) => [String(d._id), 0]));
  for (const f of userFiles(user)) {
    const obj = s3.objects.get(`${f._id}${f.extension}`);
    assert.ok(obj, `file ${f.name} has no B2 object`);
    assert.equal(obj.length, f.size, `file ${f.name}: recorded size != stored bytes`);
    const parent = Directory.get(f.parentDirId);
    assert.ok(parent, `file ${f.name} has no parent directory`);
    for (const ancestor of parent.path) {
      expected.set(String(ancestor), (expected.get(String(ancestor)) ?? 0) + f.size);
    }
  }
  for (const d of dirs) {
    assert.ok(d.size >= 0, `directory ${d.name} has negative size ${d.size}`);
    assert.equal(d.size, expected.get(String(d._id)), `directory ${d.name} size`);
  }
  assert.deepEqual(pendingOf(user), [], 'reservations left behind');
  const known = new Set([...File.docs.values()].map((f) => `${f._id}${f.extension}`));
  for (const key of s3.objects.keys()) {
    if (key.startsWith('workspaces/')) continue;
    assert.ok(known.has(key), `orphaned B2 object ${key}`);
  }
}

// =================================================================== uploads

test('normal upload: stored once, every ancestor charged the exact size, nothing pending', async () => {
  const u = makeUser(10_000);
  const a = makeDir(u, u.rootId, 'Folder A');
  const b = makeDir(u, a, 'Folder B');

  const res = await upload(u, { dirId: b, data: bytes(1234), filename: 'report.pdf' });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { message: 'File Uploaded' }); // response format unchanged

  const [file] = userFiles(u);
  assert.equal(file.name, 'report.pdf');
  assert.equal(file.extension, '.pdf');
  assert.equal(file.size, 1234);
  assert.equal(String(file.parentDirId), String(b));
  assert.equal(sizeOf(u.rootId), 1234);
  assert.equal(sizeOf(a), 1234);
  assert.equal(sizeOf(b), 1234);
  assertAccounting(u);
});

test('chunked upload (no Content-Length) of the declared size succeeds', async () => {
  const u = makeUser(10_000);
  const res = await upload(u, { filesize: 900, chunks: [bytes(300), bytes(300), bytes(300)] });
  assert.equal(res.status, 201);
  assert.equal(sizeOf(u.rootId), 900);
  assertAccounting(u);
});

test('H3: declaring more than is sent (the old quota-bypass) is rejected and charges nothing', async () => {
  const u = makeUser(10_000);

  // With a Content-Length: rejected before anything is reserved or stored.
  let res = await upload(u, { data: Buffer.alloc(0), filesize: 5000 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Uploaded file size does not match the declared size.');

  // Chunked: detected once the stream ends short.
  res = await upload(u, { filesize: 5000, chunks: [bytes(100)] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Uploaded file size does not match the declared size.');

  assert.equal(userFiles(u).length, 0, 'no file record');
  assert.equal(s3.objects.size, 0, 'no B2 object');
  assert.equal(sizeOf(u.rootId), 0);
  assertAccounting(u);
});

test('H3: the full exploit loop (short upload, trash, permanent delete) can no longer create free space', async () => {
  const u = makeUser(1000);
  for (let i = 0; i < 5; i++) {
    const res = await upload(u, { filesize: 1000, chunks: [bytes(1)] });
    assert.equal(res.status, 400);
  }
  assert.equal(userFiles(u).length, 0); // nothing to trash and delete
  assert.equal(sizeOf(u.rootId), 0); // never negative
  // The quota is exactly what it was: 1000 fits, 1001 doesn't.
  assert.equal((await upload(u, { data: bytes(1001) })).status, 413);
  assert.equal((await upload(u, { data: bytes(1000) })).status, 201);
  assertAccounting(u);
});

test('H3: a body larger than declared is cut off with 400 and cleaned up', async () => {
  const u = makeUser(10_000);

  let res = await upload(u, { filesize: 500, chunks: [bytes(400), bytes(400), bytes(400)] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Uploaded file exceeds declared size.');

  res = await upload(u, { data: bytes(2000), filesize: 500 }); // Content-Length disagrees
  assert.equal(res.status, 400);

  assert.equal(s3.objects.size, 0);
  assertAccounting(u);
});

test('invalid declared sizes are rejected before any quota is reserved', async () => {
  const u = makeUser(10_000);
  for (const filesize of ['abc', '-1', '1.5', '', '1e3', '0x10', '+5', String(Number.MAX_SAFE_INTEGER + 2)]) {
    const res = await upload(u, { data: Buffer.alloc(0), filesize, headers: { 'content-length': '0' } });
    assert.equal(res.status, 400, `filesize=${JSON.stringify(filesize)}`);
    assert.equal(res.body.error, 'Invalid filesize');
  }
  assertAccounting(u);
});

test('B2 failing mid-upload releases the reservation and leaves no record or object', async () => {
  const u = makeUser(1000);
  s3.failUploadsAfterBytes = 100;
  const res = await upload(u, { filesize: 1000, chunks: [bytes(250), bytes(250), bytes(250), bytes(250)] });
  assert.equal(res.status, 500);
  assertAccounting(u);
  assert.equal(sizeOf(u.rootId), 0);

  // Nothing leaked: the whole quota is still usable.
  s3.failUploadsAfterBytes = null;
  assert.equal((await upload(u, { data: bytes(1000) })).status, 201);
  assertAccounting(u);
});

test('a database failure while saving the file releases the reservation and deletes the object', async () => {
  const u = makeUser(1000);
  File.failNext('create');
  const res = await upload(u, { data: bytes(600) });
  assert.equal(res.status, 500);
  assert.equal(s3.objects.size, 0, 'object removed');
  assertAccounting(u);
  assert.equal(sizeOf(u.rootId), 0);
});

test('a client that disconnects mid-upload gets its reservation released', async () => {
  const u = makeUser(1000);
  const req = http.request({
    host: '127.0.0.1',
    port,
    method: 'POST',
    path: '/file',
    headers: {
      'x-test-user': u.token,
      'content-type': 'application/octet-stream',
      'content-length': '1000',
      filename: 'big.bin',
      filesize: '1000',
    },
  });
  req.on('error', () => {});
  req.write(bytes(200));
  await eventually(() => assert.equal(pendingOf(u).length, 1)); // reserved while streaming
  assert.equal(sizeOf(u.rootId), 1000);
  req.destroy();

  await eventually(() => {
    assert.equal(pendingOf(u).length, 0);
    assert.equal(sizeOf(u.rootId), 0);
  });
  await eventually(() => assert.equal(s3.objects.size, 0));
  assertAccounting(u);
});

// ================================================================ concurrency

test('M1: parallel uploads can never reserve more than the remaining quota', async () => {
  const u = makeUser(1000);
  s3.uploadDelayMs = 50; // keep every upload open so they all overlap
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) => upload(u, { data: bytes(300), filename: `f${i}.bin` })),
  );
  const ok = results.filter((r) => r.status === 201);
  const refused = results.filter((r) => r.status === 413);
  assert.equal(ok.length, 3, 'exactly floor(1000 / 300) uploads fit');
  assert.equal(refused.length, 7);
  for (const r of refused) assert.equal(r.body.error, 'Not enough storage space available.');
  assert.equal(sizeOf(u.rootId), 900);
  assertAccounting(u);
});

test('M1: parallel uploads of mixed sizes into different folders never overshoot', async () => {
  const u = makeUser(1000);
  const a = makeDir(u, u.rootId, 'Folder A');
  const b = makeDir(u, a, 'Folder B');
  s3.uploadDelayMs = 30;
  const plan = [400, 400, 400, 250, 100, 100, 50, 999, 1, 1];
  const targets = [u.rootId, a, b];
  const results = await Promise.all(
    plan.map((n, i) => upload(u, { dirId: targets[i % 3], data: bytes(n), filename: `m${i}.bin` })),
  );
  const stored = plan.filter((_, i) => results[i].status === 201).reduce((s, n) => s + n, 0);
  for (const r of results) assert.ok([201, 413].includes(r.status), `unexpected ${r.status}`);
  assert.ok(stored <= 1000, `stored ${stored} bytes with a 1000-byte quota`);
  assert.equal(sizeOf(u.rootId), stored);
  assertAccounting(u);
});

test('M1: a duplicate request with the same upload id is refused while the first is in flight', async () => {
  const u = makeUser(10_000);
  s3.uploadDelayMs = 80;
  const headers = { 'upload-id': 'retry-test-0001' };
  const [first, second] = await Promise.all([
    upload(u, { data: bytes(500), headers }),
    sleep(10).then(() => upload(u, { data: bytes(500), headers })),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [201, 409]);
  const dup = first.status === 409 ? first : second;
  assert.equal(dup.body.code, 'UPLOAD_IN_PROGRESS');
  assert.equal(userFiles(u).length, 1);
  assert.equal(sizeOf(u.rootId), 500);
  assertAccounting(u);

  // A malformed upload id is rejected outright.
  const bad = await upload(u, { data: bytes(10), headers: { 'upload-id': 'no spaces!' } });
  assert.equal(bad.status, 400);
});

test('M1: a failed attempt can be retried immediately; the retry is charged once', async () => {
  const u = makeUser(1000);
  s3.failUploadsAfterBytes = 10;
  assert.equal((await upload(u, { data: bytes(800), headers: { 'upload-id': 'retry-id-0002' } })).status, 500);
  s3.failUploadsAfterBytes = null;
  assert.equal((await upload(u, { data: bytes(800), headers: { 'upload-id': 'retry-id-0002' } })).status, 201);
  assert.equal(sizeOf(u.rootId), 800);
  assertAccounting(u);
});

// ===================================================== quota and deletion

test('quota exhaustion: an exact fit succeeds, one more byte is refused, deleting frees the space', async () => {
  const u = makeUser(1000);
  assert.equal((await upload(u, { data: bytes(1000) })).status, 201);
  assert.equal((await upload(u, { data: bytes(1) })).status, 413);

  const [file] = userFiles(u);
  const trash = await request(u, { method: 'DELETE', path: `/file/${file._id}` });
  assert.equal(trash.status, 200);
  assert.equal((await upload(u, { data: bytes(1) })).status, 413, 'Trash still counts');

  const del = await request(u, { method: 'DELETE', path: `/file/${file._id}/permanent` });
  assert.equal(del.status, 200);
  assert.equal(sizeOf(u.rootId), 0);
  assert.equal((await upload(u, { data: bytes(1000) })).status, 201);
  assertAccounting(u);
});

test('trash, restore and permanent delete keep every folder size exact', async () => {
  const u = makeUser(10_000);
  const a = makeDir(u, u.rootId, 'Folder A');
  const b = makeDir(u, a, 'Folder B');
  assert.equal((await upload(u, { dirId: b, data: bytes(300), filename: 'deep.txt' })).status, 201);
  assert.equal((await upload(u, { dirId: a, data: bytes(200), filename: 'mid.txt' })).status, 201);
  assert.equal((await upload(u, { data: bytes(50), filename: 'top.txt' })).status, 201);
  const sizes = () => [sizeOf(u.rootId), sizeOf(a), sizeOf(b)];
  assert.deepEqual(sizes(), [550, 500, 300]);

  // Trash and restore move nothing in or out of the quota.
  assert.equal((await request(u, { method: 'DELETE', path: `/directory/${a}` })).status, 200);
  assert.deepEqual(sizes(), [550, 500, 300]);
  assert.equal((await request(u, { method: 'PATCH', path: `/directory/${a}/restore` })).status, 200);
  assert.deepEqual(sizes(), [550, 500, 300]);
  assertAccounting(u);

  // Permanently deleting one file subtracts it from every ancestor.
  const deep = userFiles(u).find((f) => f.name === 'deep.txt');
  await request(u, { method: 'DELETE', path: `/file/${deep._id}` });
  assert.equal((await request(u, { method: 'DELETE', path: `/file/${deep._id}/permanent` })).status, 200);
  assert.deepEqual(sizes(), [250, 200, 0]);
  assertAccounting(u);

  // Permanently deleting a folder subtracts its whole subtree once.
  await request(u, { method: 'DELETE', path: `/directory/${a}` });
  assert.equal((await request(u, { method: 'DELETE', path: `/directory/${a}/permanent` })).status, 200);
  assert.equal(sizeOf(u.rootId), 50);
  assert.equal(Directory.get(a), null);
  assert.equal(Directory.get(b), null);
  assert.deepEqual(userFiles(u).map((f) => f.name), ['top.txt']);
  assertAccounting(u);
});

test('concurrent permanent deletes of the same file subtract its size exactly once', async () => {
  const u = makeUser(10_000);
  await upload(u, { data: bytes(300), filename: 'gone.bin' });
  await upload(u, { data: bytes(200), filename: 'kept.bin' });
  const gone = userFiles(u).find((f) => f.name === 'gone.bin');
  await request(u, { method: 'DELETE', path: `/file/${gone._id}` });

  const results = await Promise.all(
    Array.from({ length: 5 }, () => request(u, { method: 'DELETE', path: `/file/${gone._id}/permanent` })),
  );
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  assert.equal(results.filter((r) => r.status === 404).length, 4);
  assert.equal(sizeOf(u.rootId), 200, 'not 200 - 4 x 300');
  assertAccounting(u);
});

test('concurrent permanent deletes of the same folder subtract its size exactly once', async () => {
  const u = makeUser(10_000);
  const a = makeDir(u, u.rootId, 'Folder A');
  await upload(u, { dirId: a, data: bytes(400) });
  await upload(u, { data: bytes(100) });
  await request(u, { method: 'DELETE', path: `/directory/${a}` });

  const results = await Promise.all(
    Array.from({ length: 4 }, () => request(u, { method: 'DELETE', path: `/directory/${a}/permanent` })),
  );
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  assert.equal(sizeOf(u.rootId), 100);
  assertAccounting(u);
});

test('concurrent moves of the same file keep folder sizes exact', async () => {
  const u = makeUser(10_000);
  const x = makeDir(u, u.rootId, 'Folder X');
  const y = makeDir(u, u.rootId, 'Folder Y');
  await upload(u, { data: bytes(300) });
  const [file] = userFiles(u);

  const results = await Promise.all([
    request(u, { method: 'PATCH', path: `/file/${file._id}/move`, json: { newParentId: String(x) } }),
    request(u, { method: 'PATCH', path: `/file/${file._id}/move`, json: { newParentId: String(y) } }),
  ]);
  for (const r of results) assert.ok([200, 409].includes(r.status), `unexpected ${r.status}`);
  assert.equal(sizeOf(x) + sizeOf(y), 300, 'the file is counted in exactly one folder');
  assertAccounting(u);
});

test('storage never goes negative: drifted sizes are clamped at zero', async () => {
  const u = makeUser(10_000);
  const a = makeDir(u, u.rootId, 'Folder A');
  Directory.docs.get(String(u.rootId)).size = 100;
  Directory.docs.get(String(a)).size = 100;
  await updateDirectorySize(a, -500);
  assert.equal(sizeOf(a), 0);
  assert.equal(sizeOf(u.rootId), 0);
});

test('a negative used size left by the old bug is not treated as extra free space', async () => {
  const u = makeUser(1000);
  Directory.docs.get(String(u.rootId)).size = -5000; // drift from the old exploit
  assert.equal((await upload(u, { data: bytes(1001) })).status, 413);
  assert.equal((await upload(u, { data: bytes(1000) })).status, 201);
  assert.equal(sizeOf(u.rootId), 1000);
  assertAccounting(u);
});

// ============================================================ reservations

test('the sweeper reclaims a reservation whose request died, and nothing else', async () => {
  const u = makeUser(10_000);

  // A crashed upload: reserved, object stored, file document created, but the
  // reservation was never claimed (the process died in between).
  const crashedId = new ObjectId();
  const crashed = await quota.reserveStorage({
    rootDirId: u.rootId, bytes: 400, limit: 10_000, fileId: crashedId, objectKey: `${crashedId}.bin`,
  });
  s3.objects.set(`${crashedId}.bin`, bytes(400));
  File.insert({ _id: crashedId, name: 'crashed.bin', size: 400, extension: '.bin', userId: u._id, parentDirId: u.rootId });

  // A healthy in-flight upload.
  const live = await quota.reserveStorage({ rootDirId: u.rootId, bytes: 300, limit: 10_000 });
  assert.equal(sizeOf(u.rootId), 700);

  // Only the crashed one stopped sending heartbeats.
  const root = Directory.docs.get(String(u.rootId));
  root.pendingUploads.find((p) => p.id === crashed.id).at = new Date(Date.now() - quota.RESERVATION_STALE_MS - 1000);

  assert.equal(await quota.sweepStaleReservations(), 1);
  assert.equal(sizeOf(u.rootId), 300, 'only the live reservation remains');
  assert.deepEqual(pendingOf(u).map((p) => p.id), [live.id]);
  assert.equal(File.get(crashedId), null, 'unclaimed file record removed');
  assert.equal(s3.objects.has(`${crashedId}.bin`), false, 'orphaned object removed');

  assert.equal(await quota.sweepStaleReservations(), 0, 'sweeping again changes nothing');
  assert.equal(await quota.releaseReservation(live), true);
  assert.equal(await quota.releaseReservation(live), false, 'a double release is a no-op');
  assertAccounting(u);
});

test('a heartbeat keeps a long upload safe from the sweeper', async () => {
  const u = makeUser(10_000);
  const r = await quota.reserveStorage({ rootDirId: u.rootId, bytes: 300, limit: 10_000 });
  Directory.docs.get(String(u.rootId)).pendingUploads[0].at = new Date(0);
  assert.equal(await quota.touchReservation(r), true);
  assert.equal(await quota.sweepStaleReservations(), 0);
  assert.equal(sizeOf(u.rootId), 300);
  await quota.releaseReservation(r);
  assertAccounting(u);
});

test('an upload whose reservation was reclaimed mid-stream fails cleanly with 410', async () => {
  const u = makeUser(10_000);
  s3.uploadDelayMs = 150;
  const pending = upload(u, { data: bytes(500) });
  await eventually(() => assert.equal(pendingOf(u).length, 1));

  // Pretend the heartbeat stopped long ago, then let the sweeper run.
  Directory.docs.get(String(u.rootId)).pendingUploads[0].at = new Date(0);
  assert.equal(await quota.sweepStaleReservations(), 1);

  const res = await pending;
  assert.equal(res.status, 410);
  assert.equal(res.body.code, 'RESERVATION_EXPIRED');
  assert.equal(userFiles(u).length, 0);
  assert.equal(sizeOf(u.rootId), 0);
  assertAccounting(u);
});

// ============================================== workspace → My Drive copies

function makeWorkspaceFile(owner, size) {
  const ws = Workspace.insert({
    name: 'Team space', ownerId: owner._id, members: [], status: 'active',
    expiresAt: new Date(Date.now() + 86_400_000), cleanupPolicy: 'delete', size,
    cleanup: { attempts: 0, lastError: null, lastAttemptAt: null, lockedUntil: null },
  });
  const wf = WorkspaceFile.insert({
    workspaceId: ws._id, name: 'shared.pdf', size, extension: '.pdf', folderId: null,
    uploadedBy: owner._id, isReady: true,
  });
  s3.objects.set(`workspaces/${ws._id}/${wf._id}.pdf`, bytes(size));
  return { ws, wf };
}

test('M1: parallel "Save to My Drive" copies are reserved atomically too', async () => {
  const u = makeUser(1000);
  const { ws, wf } = makeWorkspaceFile(u, 400);
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      request(u, { path: `/workspace/${ws._id}/files/${wf._id}/save-to-drive`, json: {} }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 2);
  const refused = results.filter((r) => r.status === 413);
  assert.equal(refused.length, 3);
  for (const r of refused) assert.equal(r.body.error, 'Not enough space in your My Drive.');
  assert.equal(sizeOf(u.rootId), 800);
  assertAccounting(u);
});

test('a failed "Save to My Drive" copy releases its reservation', async () => {
  const u = makeUser(1000);
  const { ws, wf } = makeWorkspaceFile(u, 400);
  s3.failCopy = true;
  const res = await request(u, { path: `/workspace/${ws._id}/files/${wf._id}/save-to-drive`, json: {} });
  assert.equal(res.status, 500);
  assert.equal(sizeOf(u.rootId), 0);
  assertAccounting(u);
});
