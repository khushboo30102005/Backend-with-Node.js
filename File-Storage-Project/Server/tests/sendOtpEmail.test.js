// OTP email delivery: bounded SMTP timeouts, safe structured logging, and a
// controlled 502 (never a pending request) when the mail server misbehaves.
// nodemailer itself is replaced, so no SMTP server is ever contacted.
import { after, afterEach, before, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createFakeRedis } from './helpers/fakeRedis.js';
import { createFakeUserModel } from './helpers/fakeUserModel.js';

process.env.OTP_SECRET = 'test-only-otp-secret';
process.env.SMTP_USER = 'storage.sender@example.com';
process.env.SMTP_PASS = 'abcd efgh ijkl mnop';
const COOKIE_SECRET = 'test-only-cookie-secret';

// ------------------------------------------------------------ fake mailer
// `behaviour` decides what the next sendMail() does:
//   'ok' | { error } | 'hang' (honours the abort signal) | 'hang-ignore-signal'
let behaviour = 'ok';
const transports = [];

function createTransport(options) {
  const t = {
    options,
    sent: [],
    closed: false,
    close() {
      t.closed = true;
    },
    sendMail(message) {
      t.sent.push(message);
      if (behaviour === 'ok') return Promise.resolve({ messageId: '<id@test>' });
      if (behaviour === 'hang') {
        return new Promise((_, reject) => {
          message.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            err.code = 'EABORT';
            reject(err);
          });
        });
      }
      if (behaviour === 'hang-ignore-signal') return new Promise(() => {});
      return Promise.reject(behaviour.error);
    },
  };
  transports.push(t);
  return t;
}

const redis = createFakeRedis();
const User = createFakeUserModel();

mock.module(import.meta.resolve('nodemailer'), {
  defaultExport: { createTransport },
});
mock.module(import.meta.resolve('../config/redis.js'), { defaultExport: redis });
mock.module(import.meta.resolve('../models/userModel.js'), { defaultExport: User });
mock.module(import.meta.resolve('../services/googleAuthService.js'), {
  namedExports: { verifyIdToken: async () => { throw new Error('unused'); } },
});

const {
  sendOtpEmail,
  emailTimeouts,
  sanitizeErrorMessage,
  EMAIL_TIMEOUT_DEFAULTS,
} = await import('../services/sendOtpService.js');
const { default: userRoutes } = await import('../routes/userRoutes.js');
const { default: authRoutes } = await import('../routes/authRoutes.js');

// ------------------------------------------------------------ log capture

let logs;
beforeEach(() => {
  behaviour = 'ok';
  transports.length = 0;
  redis.flush();
  User.reset();
  delete process.env.SMTP_SEND_TIMEOUT_MS;
  logs = [];
  mock.method(console, 'log', (...a) => logs.push(['log', a.join(' ')]));
  mock.method(console, 'error', (...a) => logs.push(['error', a.join(' ')]));
});
afterEach(() => mock.restoreAll());

const otpEmailLogs = () =>
  logs
    .map(([level, line]) => {
      try {
        return { level, line, entry: JSON.parse(line) };
      } catch {
        return null;
      }
    })
    .filter((l) => l?.entry.event === 'otp_email');

function assertNoSecrets(text, otp) {
  assert.ok(!text.includes(otp), 'log contains the OTP');
  assert.ok(!text.includes('abcd efgh ijkl mnop'), 'log contains SMTP_PASS');
  assert.ok(!text.includes('abcdefghijklmnop'), 'log contains SMTP_PASS (no spaces)');
  assert.ok(!text.includes('storage.sender@example.com'), 'log contains SMTP_USER');
  assert.ok(!text.includes('alice@example.com'), 'log contains the recipient');
}

// ------------------------------------------------------------ service

test('transport gets connection, greeting and socket timeouts; send gets a signal', async () => {
  const result = await sendOtpEmail('alice@example.com', '123456');
  assert.equal(result.success, true);
  assert.equal(result.message, 'OTP sent successfully on alice@example.com.');
  const [t] = transports;
  assert.equal(t.options.connectionTimeout, EMAIL_TIMEOUT_DEFAULTS.connectionMs);
  assert.equal(t.options.greetingTimeout, EMAIL_TIMEOUT_DEFAULTS.greetingMs);
  assert.equal(t.options.socketTimeout, EMAIL_TIMEOUT_DEFAULTS.socketMs);
  assert.ok(t.sent[0].signal instanceof AbortSignal);
  assert.equal(t.sent[0].to, 'alice@example.com');
  assert.match(t.sent[0].html, /123456/); // the OTP still reaches the email
  assert.equal(t.closed, true);
});

test('success is logged as one safe JSON line', async () => {
  await sendOtpEmail('alice@example.com', '123456');
  const [l] = otpEmailLogs();
  assert.equal(l.level, 'log');
  assert.equal(l.entry.status, 'sent');
  assert.equal(l.entry.recipientDomain, 'example.com');
  assert.equal(typeof l.entry.durationMs, 'number');
  assertNoSecrets(l.line, '123456');
});

test('SMTP errors return a controlled failure and log code without secrets', async () => {
  const err = new Error(
    'Invalid login: 535-5.7.8 Username and Password not accepted for ' +
      'storage.sender@example.com (pass abcd efgh ijkl mnop) rcpt alice@example.com otp 654321',
  );
  err.code = 'EAUTH';
  err.responseCode = 535;
  err.command = 'AUTH PLAIN';
  err.permanent = true;
  behaviour = { error: err };

  const result = await sendOtpEmail('alice@example.com', '654321');
  assert.deepEqual(result, { success: false, message: 'Could not send the OTP email.' });

  const [l] = otpEmailLogs();
  assert.equal(l.level, 'error');
  assert.equal(l.entry.status, 'failed');
  assert.equal(l.entry.code, 'EAUTH');
  assert.equal(l.entry.responseCode, 535);
  assert.equal(l.entry.command, 'AUTH PLAIN');
  assert.equal(l.entry.permanent, true);
  assert.equal(l.entry.timedOut, false);
  assert.match(l.entry.message, /Username and Password not accepted/);
  assertNoSecrets(l.line, '654321');
  assert.equal(transports[0].closed, true);
});

test('a hung SMTP connection is aborted at the deadline', async () => {
  process.env.SMTP_SEND_TIMEOUT_MS = '50';
  behaviour = 'hang';
  const started = Date.now();
  const result = await sendOtpEmail('alice@example.com', '111111');
  assert.equal(result.success, false);
  assert.ok(Date.now() - started < 1000, 'did not resolve promptly');
  assert.equal(transports[0].sent[0].signal.aborted, true);
  assert.equal(transports[0].closed, true);
  const [l] = otpEmailLogs();
  assert.equal(l.entry.code, 'ESENDTIMEOUT');
  assert.equal(l.entry.timedOut, true);
  assert.equal(l.entry.timeoutsMs.sendMs, 50);
});

test('the deadline still wins if the transport ignores the abort signal', async () => {
  process.env.SMTP_SEND_TIMEOUT_MS = '50';
  behaviour = 'hang-ignore-signal';
  const started = Date.now();
  const result = await sendOtpEmail('alice@example.com', '222222');
  assert.equal(result.success, false);
  assert.ok(Date.now() - started < 1000);
  assert.equal(otpEmailLogs()[0].entry.code, 'ESENDTIMEOUT');
});

test('a throwing createTransport/sendMail is still a controlled failure', async () => {
  const err = new Error('boom');
  behaviour = { error: err }; // no code at all
  const result = await sendOtpEmail('alice@example.com', '333333');
  assert.equal(result.success, false);
  assert.equal(otpEmailLogs()[0].entry.code, 'UNKNOWN');
});

test('timeouts can be tuned by env, invalid values fall back to defaults', () => {
  assert.deepEqual(emailTimeouts({}), { ...EMAIL_TIMEOUT_DEFAULTS });
  assert.deepEqual(
    emailTimeouts({
      SMTP_CONNECTION_TIMEOUT_MS: '5000',
      SMTP_GREETING_TIMEOUT_MS: 'abc',
      SMTP_SOCKET_TIMEOUT_MS: '0',
      SMTP_SEND_TIMEOUT_MS: '999999',
    }),
    {
      connectionMs: 5000,
      greetingMs: EMAIL_TIMEOUT_DEFAULTS.greetingMs,
      socketMs: EMAIL_TIMEOUT_DEFAULTS.socketMs,
      sendMs: EMAIL_TIMEOUT_DEFAULTS.sendMs,
    },
  );
});

test('sanitizeErrorMessage redacts secrets, emails and OTP-length numbers', () => {
  const out = sanitizeErrorMessage(
    'user a.b+c@mail.example.org pass Secr3tPass code 987654\n 421 4.7.0 try later',
    { secrets: ['Secr3tPass'] },
  );
  assert.equal(out, 'user [email] pass [redacted] code [redacted] 421 4.7.0 try later');
  assert.ok(sanitizeErrorMessage('x'.repeat(1000)).length <= 301);
});

// ------------------------------------------------------------ routes

let server;
let base;
before(async () => {
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(cookieParser(COOKIE_SECRET));
  app.use(express.json());
  app.use('/', userRoutes);
  app.use('/auth', authRoutes);
  app.use((err, req, res, next) => res.status(500).json({ error: 'Something went wrong!!' }));
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

let ipSeq = 0;
async function post(path, body) {
  ipSeq += 1;
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.9.0.${ipSeq}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json(), cookies: res.headers.getSetCookie() };
}

const addAlice = () =>
  User.add({
    _id: 'a'.repeat(24),
    name: 'Alice',
    email: 'alice@example.com',
    password: 'correct-horse',
    rootDirId: '1'.repeat(24),
  });

test('login answers 502 (not pending) when the mail server hangs', async () => {
  addAlice();
  process.env.SMTP_SEND_TIMEOUT_MS = '100';
  behaviour = 'hang';
  const started = Date.now();
  const res = await post('/user/login', { email: 'alice@example.com', password: 'correct-horse' });
  assert.ok(Date.now() - started < 2000, 'login stayed pending');
  assert.equal(res.status, 502);
  assert.deepEqual(res.body, { error: 'Could not send the OTP email.' });
  assert.ok(
    !res.cookies.some((c) => c.startsWith('pending_login=')),
    'no pending-login cookie without a delivered OTP',
  );
  assert.equal(otpEmailLogs()[0].entry.code, 'ESENDTIMEOUT');
});

test('login answers 502 on an SMTP error and still works once mail recovers', async () => {
  addAlice();
  const err = new Error('Greeting never received');
  err.code = 'ETIMEDOUT';
  behaviour = { error: err };
  const failed = await post('/user/login', { email: 'alice@example.com', password: 'correct-horse' });
  assert.equal(failed.status, 502);

  behaviour = 'ok';
  const ok = await post('/user/login', { email: 'alice@example.com', password: 'correct-horse' });
  assert.equal(ok.status, 200);
  assert.ok(ok.cookies.some((c) => c.startsWith('pending_login=')));
});

test('wrong password never reaches the mailer', async () => {
  addAlice();
  const res = await post('/user/login', { email: 'alice@example.com', password: 'nope' });
  assert.equal(res.status, 404);
  assert.equal(transports.length, 0);
});

test('send-otp answers 502 (not pending) when the mail server hangs', async () => {
  process.env.SMTP_SEND_TIMEOUT_MS = '100';
  behaviour = 'hang';
  const res = await post('/auth/send-otp', { email: 'newuser@example.com' });
  assert.equal(res.status, 502);
  assert.deepEqual(res.body, { error: 'Could not send the OTP email.' });
});
