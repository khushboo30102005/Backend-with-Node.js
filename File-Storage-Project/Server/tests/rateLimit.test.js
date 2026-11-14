// Rate limiting, proxy and Redis resilience tests (audit M5, M10, the
// production 429 on /auth/cookie-test) plus the transaction helper (M8).
//
// Redis is an in-memory fake (mock.module), so no real Redis is contacted.
import { after, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createFakeRedis } from './helpers/fakeRedis.js';

const COOKIE_SECRET = 'test-only-cookie-secret';
const redis = createFakeRedis();
mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });

const { apiLimiter, sessionOrIpKey } = await import('../middlewares/rateLimitMiddleware.js');
const { RedisRateLimitStore } = await import('../middlewares/rateLimitStore.js');
const { default: cookieProbeRoutes } = await import('../routes/cookieProbeRoutes.js');
const { default: authRoutes } = await import('../routes/authRoutes.js');
const { trustProxyHops, DEFAULT_TRUST_PROXY_HOPS } = await import('../config/proxy.js');
const { reconnectDelay, RETRY_MAX_MS } = await import('../config/redisRetry.js');
const { runInTransaction, resetTransactionSupport } = await import('../utils/transaction.js');

const sign = (val) =>
  `s:${val}.${crypto.createHmac('sha256', COOKIE_SECRET).update(val).digest('base64').replace(/=+$/, '')}`;

// Mirrors the order in app.js: cookies -> probe -> global limiter -> routes.
let server;
let base;
const restartLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: new RedisRateLimitStore({ prefix: 'rl:restart-test:' }),
  });
before(async () => {
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(cookieParser(COOKIE_SECRET));
  app.use('/auth/cookie-test', cookieProbeRoutes);
  // Two separately built limiters on one Redis = one process before and
  // after a restart (or two instances).
  app.get('/before-restart', restartLimiter(), (req, res) => res.json({ ok: true }));
  app.get('/after-restart', restartLimiter(), (req, res) => res.json({ ok: true }));
  app.use(apiLimiter);
  app.use('/auth', authRoutes);
  app.get('/files', (req, res) => res.json({ ok: true }));
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());
beforeEach(() => redis.flush());

const API_LIMIT = 500;
const exhaustIp = (ip = '127.0.0.1') =>
  redis.set(`rl:api:ip:${ip}`, String(API_LIMIT), { EX: 900 });
const getWith = (path, headers = {}) => fetch(base + path, { headers });

// ================================================ production 429 regression

test('429: the cookie probe works even when the API budget of the IP is used up', async () => {
  await exhaustIp();
  const api = await getWith('/files');
  assert.equal(api.status, 429, 'control: the API itself is throttled');

  const probe = await getWith('/auth/cookie-test');
  assert.equal(probe.status, 204);
  const cookie = probe.headers.get('set-cookie');
  assert.match(cookie, /cookie_test=1/);

  const verify = await getWith('/auth/cookie-test/verify', { Cookie: 'cookie_test=1' });
  assert.equal(verify.status, 200);
  assert.deepEqual(await verify.json(), { enabled: true });
  assert.equal(redis.rawGet('rl:api:ip:127.0.0.1'), String(API_LIMIT + 1), 'probe calls are not counted');
});

test('429: app.js mounts the probe before the global limiter and the auth routes no longer serve it', async () => {
  const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const probe = src.indexOf("app.use('/auth/cookie-test', cookieProbeRoutes)");
  const limiter = src.indexOf('app.use(apiLimiter)');
  assert.ok(probe > 0 && limiter > 0);
  assert.ok(probe < limiter, 'the probe must not be behind apiLimiter');
  // The auth router (mounted behind the limiter) must not serve it as well.
  assert.equal(authRoutes.stack.some((l) => l.route?.path?.startsWith('/cookie-test')), false);
});

test('429: a throttled response from the app is JSON with RateLimit headers (unlike the platform 429)', async () => {
  await exhaustIp();
  const res = await getWith('/files');
  assert.equal(res.status, 429);
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.match(res.headers.get('ratelimit-policy'), /500/);
  assert.deepEqual(await res.json(), { error: 'Too many requests. Please try again later.' });
});

// ============================================== M5: keying behind a proxy

test('M5: signed-in users behind one shared IP each get their own API budget', async () => {
  await exhaustIp(); // e.g. a proxy egress address everybody arrives from
  const alice = { Cookie: `sid=${encodeURIComponent(sign('alice-session'))}` };
  const bob = { Cookie: `sid=${encodeURIComponent(sign('bob-session'))}` };
  assert.equal((await getWith('/files', alice)).status, 200);
  assert.equal((await getWith('/files', bob)).status, 200);
  const sidKeys = redis.keys('rl:api:sid:');
  assert.equal(sidKeys.length, 2, 'one bucket per session');
  assert.ok(sidKeys.every((k) => !k.includes('session')), 'raw session ids never become keys');
});

test('M5: a forged or unsigned sid cookie does not escape the IP limit', async () => {
  await exhaustIp();
  for (const cookie of ['sid=alice-session', `sid=${encodeURIComponent('s:alice-session.forged')}`]) {
    assert.equal((await getWith('/files', { Cookie: cookie })).status, 429, cookie);
  }
  assert.equal(redis.keys('rl:api:sid:').length, 0);
});

test('M5: sessionOrIpKey falls back to the IP without a valid signed sid', () => {
  assert.equal(sessionOrIpKey({ ip: '203.0.113.9', signedCookies: {} }), 'ip:203.0.113.9');
  assert.equal(sessionOrIpKey({ ip: '203.0.113.9', signedCookies: { sid: false } }), 'ip:203.0.113.9');
  assert.match(sessionOrIpKey({ ip: '203.0.113.9', signedCookies: { sid: 'abc' } }), /^sid:[\w-]{43}$/);
});

test('M5: different clients keep separate counters', async () => {
  await exhaustIp('10.0.0.1');
  assert.equal((await getWith('/files', { 'X-Forwarded-For': '10.0.0.1' })).status, 429);
  assert.equal((await getWith('/files', { 'X-Forwarded-For': '10.0.0.2' })).status, 200);
});

// ======================================== M5: shared, restart-proof counters

test('M5: limits survive a restart: a newly built limiter continues the Redis count', async () => {
  for (let i = 0; i < 3; i++) assert.equal((await getWith('/before-restart')).status, 200);
  assert.equal((await getWith('/after-restart')).status, 429, 'the old in-memory store reset here');
});

test('M5: counters expire with their window', async () => {
  for (let i = 0; i < 3; i++) await getWith('/before-restart');
  assert.equal((await getWith('/before-restart')).status, 429);
  redis.advance(61);
  assert.equal((await getWith('/before-restart')).status, 200);
});

test('M5: a counter left without an expiry heals instead of blocking forever', async () => {
  const store = new RedisRateLimitStore({ prefix: 'rl:heal:' });
  store.init({ windowMs: 30_000 });
  await redis.set('rl:heal:k', '7'); // INCR succeeded, PEXPIRE never ran
  const { totalHits, resetTime } = await store.increment('k');
  assert.equal(totalHits, 8);
  assert.equal(await redis.pTTL('rl:heal:k'), 30_000);
  assert.ok(resetTime instanceof Date);
});

test('M5: during a Redis outage limits fall back to memory instead of failing or hanging', async () => {
  const calls = [];
  const down = { isReady: false, incr: (...a) => calls.push(a) };
  const broken = {
    isReady: true,
    incr: async () => {
      throw Object.assign(new Error('connection reset'), { code: 'ECONNRESET' });
    },
  };
  for (const client of [down, broken]) {
    const store = new RedisRateLimitStore({ prefix: 'rl:outage:', client });
    store.init({ windowMs: 60_000 });
    const hits = [];
    for (let i = 0; i < 4; i++) hits.push((await store.increment('k')).totalHits);
    assert.deepEqual(hits, [1, 2, 3, 4], 'still counting, in memory');
    store.shutdown();
  }
  assert.equal(calls.length, 0, 'no command is queued on a client that is not ready');
});

// ================================================== M5: proxy configuration

test('M5: TRUST_PROXY_HOPS is parsed strictly', () => {
  assert.equal(trustProxyHops(undefined), DEFAULT_TRUST_PROXY_HOPS);
  assert.equal(trustProxyHops(''), DEFAULT_TRUST_PROXY_HOPS);
  assert.equal(trustProxyHops('0'), 0, 'the old `|| 1` turned 0 into 1');
  assert.equal(trustProxyHops(' 2 '), 2);
  for (const bad of ['true', '-1', '1.5', 'two', '6', '1,2']) {
    assert.throws(() => trustProxyHops(bad), /TRUST_PROXY_HOPS/, bad);
  }
});

// ====================================================== M10: Redis backoff

test('M10: reconnect delays back off exponentially, are capped, and never give up', () => {
  const lo = (n) => reconnectDelay(n, { random: () => 0 });
  const hi = (n) => reconnectDelay(n, { random: () => 1 });
  assert.deepEqual([0, 1, 2, 3].map(hi), [100, 200, 400, 800]);
  assert.deepEqual([0, 1, 2, 3].map(lo), [50, 100, 200, 400]);
  for (const n of [9, 10, 31, 100, 10_000, Number.MAX_SAFE_INTEGER]) {
    const d = reconnectDelay(n);
    assert.equal(typeof d, 'number', `attempt ${n} must retry, not return an Error`);
    assert.ok(d >= RETRY_MAX_MS / 2 && d <= RETRY_MAX_MS, `attempt ${n}: ${d}`);
  }
  for (let n = 0; n < 50; n++) {
    const d = reconnectDelay(n);
    assert.ok(Number.isFinite(d) && d > 0 && d <= RETRY_MAX_MS);
  }
});

test('M10: config/redis.js uses the backoff policy and no longer gives up after 30 retries', () => {
  const src = fs.readFileSync(new URL('../config/redis.js', import.meta.url), 'utf8');
  assert.match(src, /reconnectStrategy: \(retries\) => reconnectDelay\(retries\)/);
  assert.doesNotMatch(src, /retries > 30/);
});

// =============================================== M8: transaction helper

test('M8: runInTransaction returns the callback result from a committed transaction', async () => {
  resetTransactionSupport();
  let used = 0;
  const connection = { transaction: async (cb) => { used++; await cb(); } };
  assert.equal(await runInTransaction(async () => 42, { connection }), 42);
  assert.equal(used, 1);
});

test('M8: errors abort the transaction and reach the caller', async () => {
  resetTransactionSupport();
  const connection = { transaction: async (cb) => cb() };
  await assert.rejects(
    runInTransaction(async () => { throw new Error('step 2 failed'); }, { connection }),
    /step 2 failed/,
  );
});

test('M8: on a standalone MongoDB it falls back once and remembers', async () => {
  resetTransactionSupport();
  let attempts = 0;
  const connection = {
    transaction: async () => {
      attempts++;
      throw Object.assign(new Error('Transaction numbers are only allowed on a replica set member or mongos'), { code: 20 });
    },
  };
  let runs = 0;
  assert.equal(await runInTransaction(async () => ++runs, { connection }), 1);
  assert.equal(await runInTransaction(async () => ++runs, { connection }), 2);
  assert.equal(attempts, 1, 'support is detected once');
  resetTransactionSupport();
});

test('M8: once transactions are known to work, such an error is not swallowed', async () => {
  resetTransactionSupport();
  let fail = false;
  const connection = {
    transaction: async (cb) => {
      if (fail) throw Object.assign(new Error('IllegalOperation'), { code: 20 });
      return cb();
    },
  };
  await runInTransaction(async () => 1, { connection });
  fail = true;
  await assert.rejects(runInTransaction(async () => 2, { connection }), /IllegalOperation/);
  resetTransactionSupport();
});
