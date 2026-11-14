// CSRF protection tests (audit finding M4).
//
// The app below is wired in the same order as app.js (webhook with raw body
// first, then CORS, cookie parsing, JSON, the token endpoint and the CSRF
// guard, then the routes). Nothing external is contacted.
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {
  csrfProtection,
  issueCsrfToken,
  resetCsrfKeyForTests,
  CSRF_EXEMPT_PATHS,
} from '../middlewares/csrfMiddleware.js';
import { verifyWebhookSignature } from '../utils/paymentCrypto.js';

const COOKIE_SECRET = 'test-only-cookie-secret';
const WEBHOOK_SECRET = 'test-only-webhook-secret';
const CLIENT_URL = 'https://app.example.test';
process.env.SESSION_SECRET = COOKIE_SECRET;
delete process.env.CSRF_SECRET;
resetCsrfKeyForTests();

const webhookBodies = [];
const hits = [];

let server;
let base;
before(async () => {
  const app = express();
  app.post('/payments/webhook', express.raw({ type: () => true }), (req, res) => {
    const ok = verifyWebhookSignature(req.body, req.get('x-razorpay-signature'), WEBHOOK_SECRET);
    webhookBodies.push({ isBuffer: Buffer.isBuffer(req.body), ok });
    res.status(ok ? 200 : 400).json({ ok });
  });
  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json());
  app.get('/auth/csrf-token', issueCsrfToken);
  app.use(csrfProtection);

  // Stand-ins for real routes: a session-authenticated action and the public
  // endpoints that are deliberately exempt.
  const record = (req, res) => {
    hits.push(`${req.method} ${req.path}`);
    res.json({ ok: true, body: req.body ?? null });
  };
  app.get('/file/:id', record);
  for (const m of ['post', 'put', 'patch', 'delete']) app[m]('/file/:id', record);
  app.post('/user/logout', record);
  app.post('/auth/google', record);
  app.post('/payments/order', record);
  for (const p of CSRF_EXEMPT_PATHS) app.post(p, record);

  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

beforeEach(() => {
  hits.length = 0;
  webhookBodies.length = 0;
  process.env.SESSION_SECRET = COOKIE_SECRET;
  delete process.env.CSRF_SECRET;
  resetCsrfKeyForTests();
});

const sign = (val) =>
  `s:${val}.${crypto.createHmac('sha256', COOKIE_SECRET).update(val).digest('base64').replace(/=+$/, '')}`;

function browser({ sid } = {}) {
  const jar = new Map();
  if (sid) jar.set('sid', encodeURIComponent(sign(sid)));
  const send = async (method, path, { body, headers = {} } = {}) => {
    const h = { ...headers };
    if (body !== undefined) h['Content-Type'] ??= 'application/json';
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) h.Cookie = cookie;
    const res = await fetch(base + path, {
      method,
      headers: h,
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const i = pair.indexOf('=');
      jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, body: json, headers: res.headers };
  };
  return {
    jar,
    send,
    async token() {
      const r = await send('GET', '/auth/csrf-token');
      assert.equal(r.status, 200);
      return r.body.csrfToken;
    },
  };
}

test('M4: state-changing requests without a CSRF token are rejected', async () => {
  const b = browser({ sid: 'victim-session' });
  await b.token(); // has the csrf cookie, but the attacker cannot add the header
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const r = await b.send(method, '/file/1', { body: { x: 1 } });
    assert.equal(r.status, 403, method);
    assert.equal(r.body.code, 'CSRF_TOKEN_MISSING');
  }
  assert.deepEqual(hits, []);
});

test('M4: a cross-site "simple" form/text POST (no preflight) is rejected', async () => {
  const b = browser({ sid: 'victim-session' });
  await b.token();
  const r = await b.send('POST', '/file/1', {
    body: 'malicious file contents',
    headers: { 'Content-Type': 'text/plain', Origin: 'https://evil.example' },
  });
  assert.equal(r.status, 403);
  assert.deepEqual(hits, []);
});

test('M4: invalid, tampered or foreign tokens are rejected', async () => {
  const victim = browser({ sid: 'victim-session' });
  const good = await victim.token();

  const tries = [
    'garbage',
    good.slice(0, -2) + (good.endsWith('AA') ? 'BB' : 'AA'),
    good + 'x',
  ];
  for (const t of tries) {
    const r = await victim.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': t } });
    assert.equal(r.status, 403, t);
    assert.equal(r.body.code, 'CSRF_TOKEN_INVALID');
  }

  // A token the attacker fetched with their own browser is useless for the victim.
  const attacker = browser({ sid: 'attacker-session' });
  const attackerToken = await attacker.token();
  const r = await victim.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': attackerToken } });
  assert.equal(r.status, 403);
  assert.deepEqual(hits, []);
});

test('M4: an unsigned or forged csrf cookie is rejected', async () => {
  const b = browser({ sid: 'victim-session' });
  const token = await b.token();
  const nonce = decodeURIComponent(b.jar.get('csrf')).slice(2).split('.')[0];

  b.jar.set('csrf', nonce); // unsigned copy
  let r = await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': token } });
  assert.equal(r.status, 403);

  const fake = crypto.randomBytes(32).toString('base64url');
  b.jar.set('csrf', encodeURIComponent(`s:${fake}.forgedsignature`));
  r = await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': token } });
  assert.equal(r.status, 403);
  assert.deepEqual(hits, []);
});

test('M4: the token is bound to the session; after login a fresh token is required', async () => {
  const b = browser();
  const anonToken = await b.token();
  // Pre-login requests (e.g. Google sign-in) work with the anonymous token.
  let r = await b.send('POST', '/auth/google', { body: { idToken: 'x' }, headers: { 'X-CSRF-Token': anonToken } });
  assert.equal(r.status, 200);

  b.jar.set('sid', encodeURIComponent(sign('new-session'))); // now signed in
  r = await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': anonToken } });
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'CSRF_TOKEN_INVALID');

  const fresh = await b.token();
  r = await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': fresh } });
  assert.equal(r.status, 200);
});

test('M4: valid tokens pass for POST, PUT, PATCH and DELETE, and the body is untouched', async () => {
  const b = browser({ sid: 'victim-session' });
  const token = await b.token();
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const r = await b.send(method, '/file/1', { body: { n: method }, headers: { 'X-CSRF-Token': token } });
    assert.equal(r.status, 200, method);
    assert.deepEqual(r.body.body, { n: method });
  }
  const r = await b.send('POST', '/payments/order', { headers: { 'X-CSRF-Token': token } });
  assert.equal(r.status, 200, 'Razorpay order creation works with the token');
  assert.equal(hits.length, 5);
});

test('M4: the token endpoint reuses the nonce, is not cached, and sets a hardened cookie', async () => {
  const b = browser({ sid: 's1' });
  const first = await b.send('GET', '/auth/csrf-token');
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const setCookie = first.headers.getSetCookie().find((c) => c.startsWith('csrf='));
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  const second = await b.send('GET', '/auth/csrf-token');
  assert.equal(second.body.csrfToken, first.body.csrfToken, 'stable across tabs');
  assert.equal(second.headers.getSetCookie().some((c) => c.startsWith('csrf=')), false);
});

test('M4: safe methods and public exempt endpoints need no token', async () => {
  const b = browser({ sid: 'victim-session' });
  assert.equal((await b.send('GET', '/file/1')).status, 200);
  assert.equal((await b.send('OPTIONS', '/file/1')).status, 204);
  for (const p of CSRF_EXEMPT_PATHS) {
    const r = await b.send('POST', p, { body: { email: 'a@example.com' } });
    assert.equal(r.status, 200, p);
  }
  // ...but everything else that changes state is covered, logout included.
  assert.equal((await b.send('POST', '/user/logout')).status, 403);
  assert.equal((await b.send('POST', '/auth/google', { body: {} })).status, 403);
});

test('M4: exempt paths match exactly, not by prefix or case tricks', async () => {
  const b = browser({ sid: 'victim-session' });
  for (const p of ['/auth/send-otp/../../file/1', '/auth/send-otpx', '/AUTH/SEND-OTP']) {
    const r = await b.send('POST', p, { body: {} });
    assert.notEqual(r.status, 200, p);
  }
  assert.deepEqual(hits, []);
});

test('M4: Razorpay webhook is unaffected and still verifies its signature on the raw body', async () => {
  const raw = '{"event":"payment.captured","payload":{}}';
  const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  const ok = await fetch(`${base}/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': sig },
    body: raw,
  });
  assert.equal(ok.status, 200);
  const bad = await fetch(`${base}/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': 'bad' },
    body: raw,
  });
  assert.equal(bad.status, 400);
  assert.deepEqual(webhookBodies, [
    { isBuffer: true, ok: true },
    { isBuffer: true, ok: false },
  ]);
});

test('M4: fails closed (503) when no secret is configured', async () => {
  delete process.env.SESSION_SECRET;
  delete process.env.CSRF_SECRET;
  resetCsrfKeyForTests();
  const b = browser({ sid: 's' });
  assert.equal((await b.send('GET', '/auth/csrf-token')).status, 503);
  assert.equal((await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': 'x' } })).status, 503);
  assert.deepEqual(hits, []);
});

test('M4: CSRF_SECRET, when set, is used instead of the derived key', async () => {
  const b = browser({ sid: 's' });
  const derived = await b.token();
  process.env.CSRF_SECRET = 'explicit-csrf-secret';
  resetCsrfKeyForTests();
  const explicit = await b.token();
  assert.notEqual(explicit, derived);
  assert.equal((await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': derived } })).status, 403);
  assert.equal((await b.send('POST', '/file/1', { body: {}, headers: { 'X-CSRF-Token': explicit } })).status, 200);
});

test('M4: app.js mounts the webhook before the CSRF guard and the guard before all routes', () => {
  const src = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const at = (s) => {
    const i = src.indexOf(s);
    assert.ok(i >= 0, `app.js should contain ${s}`);
    return i;
  };
  const webhook = at("'/payments/webhook'");
  const cookies = at('app.use(cookieParser(');
  const guard = at('app.use(csrfProtection)');
  assert.ok(webhook < guard, 'webhook must not be behind the CSRF guard');
  assert.ok(cookies < guard, 'guard needs signed cookies');
  for (const route of ["app.use('/directory'", "app.use('/file'", "app.use('/'", "app.use('/auth'", "app.use('/payments'"]) {
    assert.ok(guard < at(route), `${route} must be behind the CSRF guard`);
  }
});
