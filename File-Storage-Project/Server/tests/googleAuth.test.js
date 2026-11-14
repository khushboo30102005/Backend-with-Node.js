// Google sign-in email verification tests (audit finding M3).
//
// The real services/googleAuthService.js and the real /auth/google controller
// run here; only google-auth-library's OAuth2Client is replaced by a fake that
// returns canned payloads, so Google is never contacted. Redis and the User
// model are in-memory fakes.
import { after, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createFakeRedis } from './helpers/fakeRedis.js';
import { createFakeUserModel } from './helpers/fakeUserModel.js';

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
process.env.OTP_SECRET = 'test-only-otp-secret';
const COOKIE_SECRET = 'test-only-cookie-secret';

const redis = createFakeRedis();
const User = createFakeUserModel();
const tokens = new Map(); // idToken -> payload (absent = bad signature)
const verifyCalls = [];

class FakeOAuth2Client {
  async verifyIdToken({ idToken, audience }) {
    verifyCalls.push({ idToken, audience });
    const payload = tokens.get(idToken);
    if (!payload) throw new Error('Invalid token signature');
    return { getPayload: () => payload };
  }
}

mock.module('google-auth-library', { namedExports: { OAuth2Client: FakeOAuth2Client } });
mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });
mock.module(import.meta.resolve('../models/userModel.js'), { defaultExport: User });
mock.module(import.meta.resolve('../services/sendOtpService.js'), {
  namedExports: { sendOtpEmail: async () => ({ success: true, message: 'sent' }) },
});

const { verifyIdToken, GoogleAuthError } = await import('../services/googleAuthService.js');
const { default: authRoutes } = await import('../routes/authRoutes.js');

let server;
let base;
before(async () => {
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json());
  app.use('/auth', authRoutes);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(500).json({ error: 'Something went wrong!!' }));
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

let alice;
beforeEach(() => {
  redis.flush();
  User.reset();
  tokens.clear();
  verifyCalls.length = 0;
  alice = User.add({
    _id: 'a'.repeat(24),
    name: 'Alice',
    email: 'alice@example.com',
    password: 'pw',
    rootDirId: '1'.repeat(24),
    picture: 'https://lh3.googleusercontent.com/alice',
  });
});

const claims = (over = {}) => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  sub: 'google-sub-1',
  email: 'alice@example.com',
  email_verified: true,
  name: 'Alice',
  picture: 'https://lh3.googleusercontent.com/alice',
  ...over,
});

let ipSeq = 0;
async function googleLogin(body) {
  ipSeq += 1;
  const res = await fetch(`${base}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.9.0.${ipSeq}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, body: json, setCookie: res.headers.getSetCookie() };
}
const sessionCount = () => redis.keys('session:').length;

// ------------------------------------------------------------ service

const expectCode = async (promise, code) => {
  await assert.rejects(promise, (err) => {
    assert.ok(err instanceof GoogleAuthError, `expected GoogleAuthError, got ${err}`);
    assert.equal(err.code, code);
    return true;
  });
};

test('M3: a verified Google token is accepted and checked against our client id', async () => {
  tokens.set('t', claims());
  const payload = await verifyIdToken('t');
  assert.equal(payload.email, 'alice@example.com');
  assert.deepEqual(verifyCalls, [{ idToken: 't', audience: CLIENT_ID }]);
});

test('M3: email_verified false, missing, null or a string is rejected', async () => {
  for (const value of [false, undefined, null, 'true', 'false', 1]) {
    tokens.set('t', claims({ email_verified: value }));
    await expectCode(verifyIdToken('t'), 'EMAIL_NOT_VERIFIED');
  }
  const noClaim = claims();
  delete noClaim.email_verified;
  tokens.set('t', noClaim);
  await expectCode(verifyIdToken('t'), 'EMAIL_NOT_VERIFIED');
});

test('M3: invalid signature, wrong issuer, wrong audience and missing claims are rejected', async () => {
  await expectCode(verifyIdToken('unknown-token'), 'INVALID_TOKEN');
  tokens.set('iss', claims({ iss: 'https://evil.example.com' }));
  await expectCode(verifyIdToken('iss'), 'INVALID_TOKEN');
  tokens.set('aud', claims({ aud: 'someone-elses-client' }));
  await expectCode(verifyIdToken('aud'), 'INVALID_TOKEN');
  tokens.set('sub', claims({ sub: undefined }));
  await expectCode(verifyIdToken('sub'), 'INVALID_TOKEN');
  tokens.set('mail', claims({ email: undefined }));
  await expectCode(verifyIdToken('mail'), 'EMAIL_MISSING');
  for (const bad of [undefined, null, '', 42, { a: 1 }, 'x'.repeat(5000)]) {
    await expectCode(verifyIdToken(bad), 'INVALID_TOKEN');
  }
});

test('M3: verification refuses to run without a configured client id (no audience)', async () => {
  tokens.set('t', claims());
  await expectCode(verifyIdToken('t', { audience: '' }), 'NOT_CONFIGURED');
});

// ------------------------------------------------------------ endpoint

test('M3: verified Google login still works and links to the existing account', async () => {
  tokens.set('good', claims());
  const r = await googleLogin({ idToken: 'good' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(sessionCount(), 1);
  const [key] = redis.keys('session:');
  assert.equal(redis.rawGet(key).userId, alice.id);
  assert.ok(r.setCookie.some((c) => c.startsWith('sid=')));
});

test('M3: an unverified Google email cannot sign into (take over) an existing account', async () => {
  tokens.set('unverified', claims({ email_verified: false }));
  const r = await googleLogin({ idToken: 'unverified' });
  assert.equal(r.status, 401);
  assert.equal(r.body.code, 'EMAIL_NOT_VERIFIED');
  assert.equal(sessionCount(), 0);
  assert.equal(r.setCookie.some((c) => c.startsWith('sid=')), false);
});

test('M3: a missing email_verified claim is rejected', async () => {
  const p = claims();
  delete p.email_verified;
  tokens.set('missing', p);
  const r = await googleLogin({ idToken: 'missing' });
  assert.equal(r.status, 401);
  assert.equal(sessionCount(), 0);
});

test('M3: email_verified supplied by the frontend is ignored', async () => {
  tokens.set('unverified', claims({ email_verified: false }));
  const r = await googleLogin({ idToken: 'unverified', email_verified: true, emailVerified: true });
  assert.equal(r.status, 401);
  assert.equal(sessionCount(), 0);
});

test('M3: an unverified new address creates no account', async () => {
  tokens.set('new', claims({ email: 'mallory@example.com', email_verified: false }));
  const before = User.users.size;
  const r = await googleLogin({ idToken: 'new' });
  assert.equal(r.status, 401);
  assert.equal(User.users.size, before);
});

test('M3: invalid or missing tokens get 401 (not a 500)', async () => {
  assert.equal((await googleLogin({ idToken: 'forged' })).status, 401);
  assert.equal((await googleLogin({})).status, 401);
  assert.equal(sessionCount(), 0);
});

test('M3: deleted accounts stay blocked even with a verified token', async () => {
  alice.isDeleted = true;
  tokens.set('good', claims());
  const r = await googleLogin({ idToken: 'good' });
  assert.equal(r.status, 403);
  assert.equal(sessionCount(), 0);
});
