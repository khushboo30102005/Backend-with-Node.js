// CSRF protection for cookie-authenticated requests (audit finding M4).
//
// Strategy: signed double-submit token, bound to the session.
//   1. GET /auth/csrf-token sets a random nonce in a signed, httpOnly cookie
//      (`csrf`) and returns   token = HMAC(key, nonce + "|" + sid)   in JSON.
//   2. The React app keeps the token in memory and sends it in the
//      `X-CSRF-Token` header on every POST / PUT / PATCH / DELETE.
//   3. The server recomputes the HMAC from the cookie nonce and the current
//      session id and compares in constant time.
//
// Why an attacker site cannot pass: it cannot read the httpOnly cookie, cannot
// read the token response (CORS only allows CLIENT_URL), cannot forge the
// signed cookie (needs SESSION_SECRET), and a token it obtained for its own
// browser is bound to a different nonce/session. Sending a custom header
// cross-origin also forces a CORS preflight, which is refused.
//
// Not covered here by design:
//   - Safe methods (GET/HEAD/OPTIONS) must not change state.
//   - POST /payments/webhook is registered before this middleware; it is
//     server-to-server and authenticated by Razorpay's HMAC signature.
//   - A few public endpoints that never read the session cookie (OTP send /
//     verify, register, OTP-based password reset) are exempt, so they keep
//     working for credential-less requests. Forging them gains nothing an
//     attacker cannot already do directly.
import crypto from 'node:crypto';
import { sessionCookieOptions } from '../config/cookie.js';

export const CSRF_COOKIE = 'csrf';
export const CSRF_HEADER = 'x-csrf-token';
const NONCE_BYTES = 32;
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // same as the session

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Exact paths (no prefix matching) that never use the session cookie.
export const CSRF_EXEMPT_PATHS = new Set([
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/set-password',
  '/user/register',
]);

let cachedKey = null;
function getKey() {
  if (cachedKey) return cachedKey;
  const explicit = process.env.CSRF_SECRET;
  const session = process.env.SESSION_SECRET;
  if (explicit) {
    cachedKey = Buffer.from(explicit, 'utf8');
  } else if (session) {
    // Domain-separated from the cookie-signing use of SESSION_SECRET.
    cachedKey = crypto.createHmac('sha256', session).update('csrf-token-key:v1').digest();
  } else {
    return null;
  }
  return cachedKey;
}

/** Test hook: forget the derived key (after changing env vars). */
export function resetCsrfKeyForTests() {
  cachedKey = null;
}

const sidOf = (req) => {
  const sid = req.signedCookies?.sid;
  return typeof sid === 'string' ? sid : '';
};

export function computeCsrfToken(nonce, sid, key = getKey()) {
  return crypto
    .createHmac('sha256', key)
    .update(`${nonce}|${sid}`)
    .digest('base64url');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const validNonce = (n) => typeof n === 'string' && /^[A-Za-z0-9_-]{43}$/.test(n);

/** GET /auth/csrf-token — issues (or reuses) the nonce and returns the token. */
export function issueCsrfToken(req, res) {
  const key = getKey();
  res.set('Cache-Control', 'no-store');
  if (!key) {
    return res.status(503).json({ error: 'CSRF protection is not configured.' });
  }
  let nonce = req.signedCookies?.[CSRF_COOKIE];
  if (!validNonce(nonce)) {
    nonce = crypto.randomBytes(NONCE_BYTES).toString('base64url');
    res.cookie(CSRF_COOKIE, nonce, sessionCookieOptions(COOKIE_MAX_AGE_MS));
  }
  return res.json({ csrfToken: computeCsrfToken(nonce, sidOf(req), key) });
}

const reject = (res, code, error) =>
  res.status(403).json({ error, code });

/** Global guard for state-changing requests. Mount after cookieParser. */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (CSRF_EXEMPT_PATHS.has(req.path)) return next();

  const key = getKey();
  if (!key) {
    // Fail closed rather than silently running unprotected.
    return res.status(503).json({ error: 'CSRF protection is not configured.' });
  }

  const header = req.get(CSRF_HEADER);
  if (typeof header !== 'string' || header.length === 0) {
    return reject(res, 'CSRF_TOKEN_MISSING', 'Missing CSRF token. Refresh the page and try again.');
  }
  const nonce = req.signedCookies?.[CSRF_COOKIE];
  if (!validNonce(nonce)) {
    return reject(res, 'CSRF_TOKEN_INVALID', 'Invalid CSRF token. Refresh the page and try again.');
  }
  if (!safeEqual(header, computeCsrfToken(nonce, sidOf(req), key))) {
    return reject(res, 'CSRF_TOKEN_INVALID', 'Invalid CSRF token. Refresh the page and try again.');
  }
  return next();
}
