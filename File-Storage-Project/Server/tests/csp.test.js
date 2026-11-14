// Content Security Policy configuration tests (audit M9).
//
// The SPA is served by Vercel, so the policy lives in Client/vercel.json.
// These tests read the deployed configuration and the page shell; they don't
// need a browser or any network access.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const clientFile = (p) => new URL(`../../Client/${p}`, import.meta.url);
const vercel = JSON.parse(fs.readFileSync(clientFile('vercel.json'), 'utf8'));
const headers = vercel.headers.find((h) => h.source === '/(.*)').headers;
const header = (key) => headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

const parse = (policy) =>
  Object.fromEntries(
    policy
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...sources] = d.split(/\s+/);
        return [name, sources];
      }),
  );

const enforced = parse(header('Content-Security-Policy') ?? '');
const candidate = parse(header('Content-Security-Policy-Report-Only') ?? '');

test('M9: the CSP is enforced, not only reported', () => {
  assert.ok(header('Content-Security-Policy'), 'Content-Security-Policy header must be set');
  assert.ok(Object.keys(enforced).length > 5);
});

test('M9: the enforced policy keeps the protective directives', () => {
  assert.deepEqual(enforced['default-src'], ["'self'"]);
  assert.deepEqual(enforced['object-src'], ["'none'"]);
  assert.deepEqual(enforced['base-uri'], ["'self'"]);
  assert.deepEqual(enforced['frame-ancestors'], ["'none'"]);
  for (const [name, sources] of Object.entries(enforced)) {
    assert.ok(!sources.includes('*'), `${name} must not allow everything`);
    assert.ok(!sources.includes("'unsafe-eval'"), `${name} must not allow eval`);
    assert.ok(!sources.includes('http:') && !sources.includes('https:'), `${name} must not allow any host`);
  }
});

const required = {
  'Google sign-in': {
    'script-src': ['https://accounts.google.com'],
    'frame-src': ['https://accounts.google.com'],
    'connect-src': ['https://accounts.google.com'],
    'style-src': ['https://accounts.google.com'],
    'img-src': ['https://*.googleusercontent.com'],
  },
  'Razorpay checkout': {
    'script-src': ['https://checkout.razorpay.com'],
    'frame-src': ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
    'connect-src': ['https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
  },
  'File previews (B2 signed URLs, Office viewer, avatars)': {
    'img-src': ['https://*.backblazeb2.com', 'https://cdn.pixabay.com', 'blob:', 'data:'],
    'media-src': ['https://*.backblazeb2.com', 'blob:'],
    'frame-src': ['https://*.backblazeb2.com', 'https://view.officeapps.live.com'],
    'connect-src': ['https://*.backblazeb2.com'],
  },
  'API through the /api rewrite': { 'connect-src': ["'self'"] },
};
for (const [feature, directives] of Object.entries(required)) {
  test(`M9: the enforced policy allows ${feature}`, () => {
    for (const [name, sources] of Object.entries(directives)) {
      for (const source of sources) {
        assert.ok(enforced[name]?.includes(source), `${name} must include ${source}`);
      }
    }
  });
}

test('M9: the page shell has no inline script (needed to drop unsafe-inline later)', () => {
  const html = fs.readFileSync(clientFile('index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length >= 1);
  for (const [, attrs, body] of scripts) {
    assert.match(attrs, /\bsrc=/, 'every script must be loaded from a file');
    assert.equal(body.trim(), '');
  }
  assert.ok(fs.existsSync(clientFile('public/theme-init.js')), 'theme script moved to public/');
});

test('M9: the stricter report-only candidate differs only by dropping inline scripts', () => {
  assert.ok(!candidate['script-src'].includes("'unsafe-inline'"));
  const { 'script-src': a, ...restEnforced } = enforced;
  const { 'script-src': b, ...restCandidate } = candidate;
  assert.deepEqual(restCandidate, restEnforced);
  assert.deepEqual(b, a.filter((s) => s !== "'unsafe-inline'"));
});
