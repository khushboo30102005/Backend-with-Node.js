// Authentication security tests (audit findings C1, H1, H2).
// Redis, the User model, the mailer and Google token verification are replaced
// with in-memory fakes via mock.module, so no real MongoDB / Redis / SMTP /
// Google endpoint is ever contacted.
import { after, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createFakeRedis } from './helpers/fakeRedis.js';
import { createFakeUserModel } from './helpers/fakeUserModel.js';

process.env.OTP_SECRET = 'test-only-otp-secret';
const COOKIE_SECRET = 'test-only-cookie-secret';

const redis = createFakeRedis();
const User = createFakeUserModel();
const outbox = [];
const googleTokens = new Map();

mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });
mock.module(import.meta.resolve('../models/userModel.js'), { defaultExport: User });
mock.module(import.meta.resolve('../services/sendOtpService.js'), {
  namedExports: {
    sendOtpEmail: async (email, otp) => {
      outbox.push({ email, otp });
      return { success: true, message: `OTP sent successfully on ${email}.` };
    },
  },
});
mock.module(import.meta.resolve('../services/googleAuthService.js'), {
  namedExports: {
    verifyIdToken: async (idToken) => {
      const payload = googleTokens.get(idToken);
      if (!payload) throw new Error('bad google token');
      return payload;
    },
  },
});

const { default: authRoutes } = await import('../routes/authRoutes.js');
const { default: userRoutes } = await import('../routes/userRoutes.js');
const { default: checkAuth, checkIsOwnerUser } = await import(
  '../middlewares/authMiddleware.js'
);
const { emailAndIpLimiter } = await import('../middlewares/otpRateLimitMiddleware.js');
const otpCrypto = await import('../utils/otpCrypto.js');
const { MAX_OTP_ATTEMPTS, OTP_TTL_SECONDS, PENDING_LOGIN_TTL_SECONDS } =
  await import('../services/otpService.js');

// ------------------------------------------------------------ test harness

let server;
let base;
before(async () => {
  const app = express();
  app.set('trust proxy', 'loopback'); // lets tests choose the client IP
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json());
  app.use('/', userRoutes);
  app.use('/auth', authRoutes);
  app.get('/protected', checkAuth, (req, res) => res.json(req.user));
  app.get('/owner-only', checkAuth, checkIsOwnerUser, (req, res) =>
    res.json({ ok: true }),
  );
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

const PASSWORD = 'correct-horse';
let alice;
let bob;
beforeEach(() => {
  redis.flush();
  User.reset();
  outbox.length = 0;
  googleTokens.clear();
  alice = User.add({
    _id: 'a'.repeat(24),
    name: 'Alice',
    email: 'alice@example.com',
    password: PASSWORD,
    rootDirId: '1'.repeat(24),
  });
  bob = User.add({
    _id: 'b'.repeat(24),
    name: 'Bob',
    email: 'bob@example.com',
    password: 'bob-password',
    rootDirId: '2'.repeat(24),
  });
});

// Each request gets a fresh client IP by default, so the in-memory per-IP
// express-rate-limit limiters never interfere unless a test pins the IP.
let ipSeq = 0;
const freshIp = () => {
  ipSeq += 1;
  return `10.${(ipSeq >> 16) & 255}.${(ipSeq >> 8) & 255}.${ipSeq & 255}`;
};

function agent() {
  const jar = new Map();
  const send = async (method, path, body, { ip = freshIp(), cookie } = {}) => {
    const headers = { 'X-Forwarded-For': ip };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const cookieHeader =
      cookie ?? [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookieHeader) headers.Cookie = cookieHeader;
    const res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(';');
      const idx = pair.indexOf('=');
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      const expired = attrs.some((a) => /expires=.*1970/i.test(a));
      if (!value || expired) jar.delete(name);
      else jar.set(name, value);
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, body: json };
  };
  return {
    jar,
    post: (path, body, opts) => send('POST', path, body, opts),
    get: (path, opts) => send('GET', path, undefined, opts),
  };
}

const lastOtpFor = (email) =>
  [...outbox].reverse().find((m) => m.email === email)?.otp;
const wrongOtp = (otp) => String((Number(otp) + 1) % 1_000_000).padStart(6, '0');

async function passwordStep(a, email = alice.email, password = PASSWORD) {
  const res = await a.post('/user/login', { email, password });
  return { res, otp: lastOtpFor(email) };
}

async function fullLogin(a, email = alice.email, password = PASSWORD) {
  const { otp } = await passwordStep(a, email, password);
  return a.post('/auth/verify-login-otp', { email, otp });
}

// ======================================================= C1: OTP hardening

test('C1: OTPs come from crypto.randomInt and are 6 digits with leading zeros', () => {
  const spy = mock.method(crypto, 'randomInt', () => 42);
  try {
    assert.equal(otpCrypto.generateOtp(), '000042');
    assert.equal(spy.mock.callCount(), 1);
    assert.deepEqual(spy.mock.calls[0].arguments, [0, 1_000_000]);
  } finally {
    spy.mock.restore();
  }
  for (let i = 0; i < 2000; i++) assert.match(otpCrypto.generateOtp(), /^\d{6}$/);
});

test('C1: OTP hashes are keyed (HMAC) and scope-bound, compared in constant time', () => {
  const h = otpCrypto.hashOtp('otp:email:a@x.io', '123456');
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.notEqual(h, crypto.createHash('sha256').update('123456').digest('hex'));
  assert.notEqual(h, otpCrypto.hashOtp('otp:email:b@x.io', '123456'));
  assert.ok(otpCrypto.otpMatches('otp:email:a@x.io', '123456', h));
  assert.equal(otpCrypto.otpMatches('otp:email:a@x.io', '123457', h), false);
  assert.equal(otpCrypto.otpMatches('otp:email:a@x.io', '123456', 'zz'), false);
  const old = process.env.OTP_SECRET;
  process.env.OTP_SECRET = 'another-secret';
  try {
    assert.notEqual(otpCrypto.hashOtp('otp:email:a@x.io', '123456'), h);
  } finally {
    process.env.OTP_SECRET = old;
  }
});

test('C1: email and login OTPs are stored only as hashes, never plaintext', async () => {
  const a = agent();
  await a.post('/auth/send-otp', { email: 'new@example.com' });
  const emailOtp = lastOtpFor('new@example.com');
  const { otp: loginOtp } = await passwordStep(a);

  const values = redis.keys().map((k) => String(redis.rawGet(k)));
  assert.ok(values.length > 0);
  for (const v of values) {
    assert.equal(v.includes(emailOtp), false, 'plaintext email OTP stored');
    assert.equal(v.includes(loginOtp), false, 'plaintext login OTP stored');
  }
  assert.match(redis.rawGet('otp:email:new@example.com'), /^[0-9a-f]{64}$/);
  // The pending-login token is stored only as its SHA-256 as well.
  const token = decodeURIComponent(a.jar.get('pending_login')).slice(2).split('.')[0];
  assert.equal(redis.keys().some((k) => k.includes(token)), false);
});

test('C1: 4-digit (old format) and non-numeric OTPs are rejected by validation', async () => {
  const a = agent();
  await passwordStep(a);
  for (const otp of ['1234', '12345a', '1234567', 123456]) {
    const r = await a.post('/auth/verify-login-otp', { email: alice.email, otp });
    assert.equal(r.status, 400);
  }
  // Validation failures do not burn the real OTP.
  const r = await a.post('/auth/verify-login-otp', {
    email: alice.email,
    otp: lastOtpFor(alice.email),
  });
  assert.equal(r.status, 200);
});

test('C1: login OTP is destroyed after 5 failed attempts (brute force)', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  for (let i = 1; i <= MAX_OTP_ATTEMPTS; i++) {
    const r = await a.post('/auth/verify-login-otp', {
      email: alice.email,
      otp: wrongOtp(otp),
    });
    assert.equal(r.status, 400);
    if (i < MAX_OTP_ATTEMPTS) assert.equal(r.body.error, 'Invalid or expired OTP.');
    else assert.match(r.body.error, /Too many incorrect attempts/);
  }
  assert.equal(a.jar.has('pending_login'), false, 'pending cookie cleared on lock');
  assert.deepEqual(redis.keys('pending-login:'), []);
  // Even the correct OTP no longer works (re-sending the old cookie too).
  const r = await a.post('/auth/verify-login-otp', { email: alice.email, otp });
  assert.ok(r.status === 400 || r.status === 401);
  assert.equal(a.jar.has('sid'), false);
});

test('C1: 4 failures followed by the correct OTP still logs in', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  for (let i = 0; i < MAX_OTP_ATTEMPTS - 1; i++) {
    await a.post('/auth/verify-login-otp', { email: alice.email, otp: wrongOtp(otp) });
  }
  const r = await a.post('/auth/verify-login-otp', { email: alice.email, otp });
  assert.equal(r.status, 200);
  assert.ok(a.jar.has('sid'));
});

test('C1: parallel guessing cannot exceed the attempt limit', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  const guesses = Array.from({ length: 40 }, (_, i) =>
    String((Number(otp) + 1 + i) % 1_000_000).padStart(6, '0'),
  );
  const cookie = [...a.jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const results = await Promise.all(
    guesses.map((g) =>
      agent().post('/auth/verify-login-otp', { email: alice.email, otp: g }, { cookie }),
    ),
  );
  assert.ok(results.every((r) => r.status === 400 || r.status === 429));
  const r = await agent().post('/auth/verify-login-otp', { email: alice.email, otp }, { cookie });
  assert.notEqual(r.status, 200, 'correct OTP must be dead after the limit');
  assert.deepEqual(redis.keys('session:'), []);
});

test('C1: email OTP (register / set-password) is locked after 5 failures', async () => {
  const a = agent();
  alice.password = undefined; // Google-only account wanting a password
  await a.post('/auth/send-otp', { email: alice.email });
  const otp = lastOtpFor(alice.email);
  for (let i = 1; i <= MAX_OTP_ATTEMPTS; i++) {
    const r = await a.post('/auth/verify-otp', { email: alice.email, otp: wrongOtp(otp) });
    assert.equal(r.status, 400);
  }
  const r = await a.post('/auth/set-password', {
    email: alice.email,
    otp,
    newPassword: 'new-password',
    confirmPassword: 'new-password',
  });
  assert.equal(r.status, 400);
  assert.equal(alice.password, undefined);
});

test('C1: OTPs expire after the TTL', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  redis.advance(Math.max(OTP_TTL_SECONDS, PENDING_LOGIN_TTL_SECONDS) + 1);
  const r = await a.post('/auth/verify-login-otp', { email: alice.email, otp });
  assert.equal(r.status, 400);
  assert.equal(a.jar.has('sid'), false);

  await a.post('/auth/send-otp', { email: 'new@example.com' });
  const emailOtp = lastOtpFor('new@example.com');
  redis.advance(OTP_TTL_SECONDS + 1);
  const v = await a.post('/auth/verify-otp', { email: 'new@example.com', otp: emailOtp });
  assert.equal(v.status, 400);
});

test('C1: a login OTP cannot be reused after a successful login', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  const pendingCookie = `pending_login=${a.jar.get('pending_login')}`;
  assert.equal((await a.post('/auth/verify-login-otp', { email: alice.email, otp })).status, 200);
  assert.equal(a.jar.has('pending_login'), false, 'pending cookie cleared');

  const replay = await agent().post(
    '/auth/verify-login-otp',
    { email: alice.email, otp },
    { cookie: pendingCookie },
  );
  assert.equal(replay.status, 400);
  assert.equal(redis.keys('session:').length, 1, 'no second session created');
});

test('C1: an email OTP is single-use; verify-otp pre-check does not consume it', async () => {
  const a = agent();
  alice.password = undefined;
  await a.post('/auth/send-otp', { email: alice.email });
  const otp = lastOtpFor(alice.email);
  assert.equal((await a.post('/auth/verify-otp', { email: alice.email, otp })).status, 200);
  const body = { email: alice.email, otp, newPassword: 'pw-123456', confirmPassword: 'pw-123456' };
  assert.equal((await a.post('/auth/set-password', body)).status, 200);
  alice.password = undefined;
  const again = await a.post('/auth/set-password', body);
  assert.equal(again.status, 400, 'OTP must be consumed after use');
  assert.equal(alice.password, undefined);
});

test('C1: requesting a new OTP invalidates the previous one', async () => {
  const a = agent();
  await a.post('/auth/send-otp', { email: 'new@example.com' });
  const first = lastOtpFor('new@example.com');
  await a.post('/auth/send-otp', { email: 'new@example.com' });
  const second = lastOtpFor('new@example.com');
  if (first !== second) {
    assert.equal((await a.post('/auth/verify-otp', { email: 'new@example.com', otp: first })).status, 400);
  }
  assert.equal((await a.post('/auth/verify-otp', { email: 'new@example.com', otp: second })).status, 200);
});

test('C1: send-otp is rate limited per email even across different IPs', async () => {
  const statuses = [];
  for (let i = 0; i < 5; i++) {
    statuses.push((await agent().post('/auth/send-otp', { email: 'victim@example.com' })).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  assert.equal(outbox.filter((m) => m.email === 'victim@example.com').length, 3);
});

test('C1: verify endpoints are rate limited per email across IPs', async () => {
  const a = agent();
  await passwordStep(a);
  const cookie = [...a.jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const statuses = [];
  for (let i = 0; i < 12; i++) {
    // invalid format: rejected by the validator, but still counted by the limiter
    const r = await agent().post('/auth/verify-login-otp', { email: alice.email, otp: 'x' }, { cookie });
    statuses.push(r.status);
  }
  assert.equal(statuses.filter((s) => s === 429).length, 2);
});

test('C1: password login is rate limited per email across IPs', async () => {
  const statuses = [];
  for (let i = 0; i < 11; i++) {
    statuses.push((await agent().post('/user/login', { email: alice.email, password: 'nope' })).status);
  }
  assert.equal(statuses.at(-1), 429);
  assert.equal(statuses.filter((s) => s === 404).length, 10);
});

test('C1: email+IP limiter caps per IP and per identity, and resets after the window', async () => {
  const limiter = emailAndIpLimiter({ name: 't', windowSec: 60, identityLimit: 2, ipLimit: 3 });
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(express.json());
  app.post('/x', limiter, (req, res) => res.json({ ok: true }));
  const s = await new Promise((r) => {
    const srv = app.listen(0, '127.0.0.1', () => r(srv));
  });
  const url = `http://127.0.0.1:${s.address().port}/x`;
  const call = (email, ip) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
      body: JSON.stringify({ email }),
    }).then((r) => r.status);
  try {
    // Same IP, different emails: IP cap (3) applies.
    assert.deepEqual(
      [await call('1@x.io', '9.9.9.9'), await call('2@x.io', '9.9.9.9'), await call('3@x.io', '9.9.9.9'), await call('4@x.io', '9.9.9.9')],
      [200, 200, 200, 429],
    );
    // Same email (case-insensitive), different IPs: identity cap (2) applies.
    assert.deepEqual(
      [await call('V@x.io', '1.1.1.1'), await call('v@x.io', '1.1.1.2'), await call('v@X.io', '1.1.1.3')],
      [200, 200, 429],
    );
    redis.advance(61);
    assert.equal(await call('v@x.io', '9.9.9.9'), 200, 'window expired');
  } finally {
    s.close();
  }
});

// ================================================ H1: deleted users blocked

test('H1: deleted user cannot start a password login (no OTP is sent)', async () => {
  alice.isDeleted = true;
  const a = agent();
  const { res } = await passwordStep(a);
  assert.equal(res.status, 403);
  assert.equal(outbox.length, 0);
  assert.equal(a.jar.has('pending_login'), false);
});

test('H1: deleted user cannot request an OTP via send-otp', async () => {
  alice.isDeleted = true;
  const r = await agent().post('/auth/send-otp', { email: 'Alice@Example.com' });
  assert.equal(r.status, 403);
  assert.equal(outbox.length, 0);
  assert.deepEqual(redis.keys('otp:'), []);
});

test('H1: user deleted between password and OTP step cannot finish login', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  alice.isDeleted = true;
  const r = await a.post('/auth/verify-login-otp', { email: alice.email, otp });
  assert.equal(r.status, 403);
  assert.equal(a.jar.has('sid'), false);
  assert.deepEqual(redis.keys('session:'), []);
});

test('H1: deleted user cannot verify or use an OTP issued before deletion', async () => {
  const a = agent();
  alice.password = undefined;
  await a.post('/auth/send-otp', { email: alice.email });
  const otp = lastOtpFor(alice.email);
  alice.isDeleted = true;
  assert.equal((await a.post('/auth/verify-otp', { email: alice.email, otp })).status, 403);
  const r = await a.post('/auth/set-password', {
    email: alice.email,
    otp,
    newPassword: 'pw-123456',
    confirmPassword: 'pw-123456',
  });
  assert.equal(r.status, 403);
  assert.equal(alice.password, undefined);
});

test('H1: an existing session stops working once the account is deleted', async () => {
  const a = agent();
  assert.equal((await fullLogin(a)).status, 200);
  assert.equal((await a.get('/protected')).status, 200);

  alice.isDeleted = true;
  const r = await a.get('/protected');
  assert.equal(r.status, 401);
  assert.deepEqual(redis.keys('session:'), [], 'stale session removed');
  assert.equal(a.jar.has('sid'), false, 'cookie cleared');

  alice.isDeleted = false; // recovery by Owner does not resurrect the session
  assert.equal((await a.get('/protected')).status, 401);
});

test('H1: a session for a hard-deleted (missing) user is rejected', async () => {
  const a = agent();
  await fullLogin(a);
  User.users.delete(alice.id);
  assert.equal((await a.get('/protected')).status, 401);
});

test('H1: Google sign-in still rejects deleted users and works for active ones', async () => {
  googleTokens.set('alice-token', { sub: 'g1', name: 'Alice', email: alice.email, email_verified: true, picture: 'p' });
  const a = agent();
  const ok = await a.post('/auth/google', { idToken: 'alice-token' });
  assert.equal(ok.status, 200);
  assert.equal((await a.get('/protected')).status, 200);

  alice.isDeleted = true;
  const b = agent();
  const denied = await b.post('/auth/google', { idToken: 'alice-token' });
  assert.equal(denied.status, 403);
  assert.equal(b.jar.has('sid'), false);
});

// ======================================= H2: no password bypass via OTP login

test('H2: an OTP from public send-otp cannot log anyone in (no password step)', async () => {
  const attacker = agent();
  await attacker.post('/auth/send-otp', { email: alice.email });
  const otp = lastOtpFor(alice.email); // worst case: attacker somehow has it
  const r = await attacker.post('/auth/verify-login-otp', { email: alice.email, otp });
  assert.equal(r.status, 401);
  assert.equal(attacker.jar.has('sid'), false);
  assert.deepEqual(redis.keys('session:'), []);
});

test('H2: a pending login for one account cannot be used for another', async () => {
  const attacker = agent();
  await passwordStep(attacker, bob.email, 'bob-password'); // attacker = Bob
  await agent().post('/auth/send-otp', { email: alice.email });
  const victimOtp = lastOtpFor(alice.email);
  const r = await attacker.post('/auth/verify-login-otp', { email: alice.email, otp: victimOtp });
  assert.equal(r.status, 400);
  assert.deepEqual(redis.keys('session:'), []);
});

test('H2: an email OTP is not accepted as a login OTP even with a valid pending login', async () => {
  const a = agent();
  const { otp: loginOtp } = await passwordStep(a);
  await agent().post('/auth/send-otp', { email: alice.email });
  const emailOtp = lastOtpFor(alice.email);
  if (emailOtp !== loginOtp) {
    const r = await a.post('/auth/verify-login-otp', { email: alice.email, otp: emailOtp });
    assert.equal(r.status, 400);
  }
  assert.equal((await a.post('/auth/verify-login-otp', { email: alice.email, otp: loginOtp })).status, 200);
});

test('H2: forged, unsigned or tampered pending-login cookies are rejected', async () => {
  const a = agent();
  const { otp } = await passwordStep(a);
  const real = decodeURIComponent(a.jar.get('pending_login')); // "s:<token>.<sig>"
  const token = real.slice(2, real.lastIndexOf('.'));
  for (const cookie of [
    `pending_login=${encodeURIComponent(token)}`, // unsigned
    `pending_login=${encodeURIComponent(`s:${token}.forgedsignature`)}`,
    `pending_login=${encodeURIComponent(`s:${'A'.repeat(43)}.x`)}`,
  ]) {
    const r = await agent().post('/auth/verify-login-otp', { email: alice.email, otp }, { cookie });
    assert.equal(r.status, 401);
  }
  assert.deepEqual(redis.keys('session:'), []);
});

test('H2: wrong password creates no pending login and sends no OTP', async () => {
  const a = agent();
  const { res } = await passwordStep(a, alice.email, 'wrong-password');
  assert.equal(res.status, 404);
  assert.equal(outbox.length, 0);
  assert.equal(a.jar.has('pending_login'), false);
  assert.deepEqual(redis.keys('pending-login'), []);
});

test('H2: Google-only account (no password) cannot start an OTP login', async () => {
  alice.password = undefined;
  const a = agent();
  const { res } = await passwordStep(a, alice.email, '');
  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'PASSWORD_NOT_SET');
  assert.equal(outbox.length, 0);
});

test('H2: a newer login invalidates the older pending login', async () => {
  const first = agent();
  const { otp: otp1 } = await passwordStep(first);
  const second = agent();
  const { otp: otp2 } = await passwordStep(second);
  assert.equal((await first.post('/auth/verify-login-otp', { email: alice.email, otp: otp1 })).status, 400);
  assert.equal((await second.post('/auth/verify-login-otp', { email: alice.email, otp: otp2 })).status, 200);
});

test('H2: full legitimate flow works and the session carries the right role', async () => {
  alice.role = 'Owner';
  const a = agent();
  const { res } = await passwordStep(a, 'ALICE@example.com'); // case-insensitive email
  assert.equal(res.status, 200);
  assert.ok(a.jar.has('pending_login'));
  const r = await a.post('/auth/verify-login-otp', {
    email: 'Alice@Example.com',
    otp: lastOtpFor(alice.email),
  });
  assert.equal(r.status, 200);
  assert.ok(a.jar.has('sid'));
  assert.equal(a.jar.has('pending_login'), false);
  const me = await a.get('/protected');
  assert.equal(me.status, 200);
  assert.equal(me.body.role, 'Owner');
  assert.equal((await a.get('/owner-only')).status, 200, 'Owner permissions intact');
});

test('H2: a correct password alone no longer evicts existing sessions', async () => {
  const d1 = agent();
  const d2 = agent();
  await fullLogin(d1);
  await fullLogin(d2);
  assert.equal(redis.keys('session:').length, 2);

  await passwordStep(agent()); // password only, OTP never entered
  assert.equal(redis.keys('session:').length, 2);
  assert.equal((await d1.get('/protected')).status, 200);
  assert.equal((await d2.get('/protected')).status, 200);

  await fullLogin(agent()); // a completed third login still evicts the oldest
  assert.equal(redis.keys('session:').length, 2);
});
