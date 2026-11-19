import crypto from 'node:crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisRateLimitStore } from './rateLimitStore.js';

// Every limiter counts in Redis (audit M5), so limits survive restarts and
// redeploys and are shared by all instances. `name` must be unique: it is the
// Redis key prefix that keeps one limiter's counters apart from another's.
const names = new Set();
export function createRateLimiter({ name, windowMs, limit, message, keyGenerator, skip }) {
  if (names.has(name)) throw new Error(`Duplicate rate limiter name: ${name}`);
  names.add(name);
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
    store: new RedisRateLimitStore({ prefix: `rl:${name}:` }),
    ...(keyGenerator && { keyGenerator }),
    ...(skip && { skip }),
  });
}

// Client IP, with IPv6 addresses grouped by /56 subnet (one subscriber).
export const ipKey = (req) => `ip:${ipKeyGenerator(req.ip)}`;

// Signed-in requests are counted per session rather than per IP. Behind the
// Vercel -> Render proxy chain many users can reach the API from the same
// address (a proxy egress IP, an office or mobile-carrier NAT), and one shared
// per-IP bucket let one busy user, or simply many users together, lock
// everyone out. The sid cookie is signed (cookie-parser verifies it), so it
// can't be invented to get extra buckets: each one needs a real login, which
// is itself rate limited. Anything without a valid signed sid is counted per
// IP exactly as before. The raw sid never becomes a Redis key.
export const sessionOrIpKey = (req) => {
  const sid = req.signedCookies?.sid;
  if (typeof sid === 'string' && sid) {
    return `sid:${crypto.createHash('sha256').update(sid).digest('base64url')}`;
  }
  return ipKey(req);
};

const userKey = (req) => `user:${req.user._id}`;

const MIN15 = 15 * 60 * 1000;

export const apiLimiter = createRateLimiter({
  name: 'api',
  windowMs: MIN15,
  limit: 500,
  keyGenerator: sessionOrIpKey,
  message: 'Too many requests. Please try again later.',
});

export const otpSendLimiter = createRateLimiter({
  name: 'otp-send',
  windowMs: MIN15,
  limit: 3,
  keyGenerator: ipKey,
  message: 'Too many OTP requests. Please try again later.',
});

export const authLimiter = createRateLimiter({
  name: 'auth',
  windowMs: MIN15,
  limit: 10,
  keyGenerator: ipKey,
  message: 'Too many requests. Please try again later.',
});

export const avatarLimiter = createRateLimiter({
  name: 'avatar',
  windowMs: MIN15,
  limit: 20,
  keyGenerator: ipKey,
  message: 'Too many photo changes. Please try again later.',
});

// Exact-email user lookup (audit M6). Per account, so a signed-in attacker
// can't test a dictionary of addresses quickly; generous enough for people
// typing several addresses into the share and invite dialogs.
export const userSearchLimiter = createRateLimiter({
  name: 'user-search',
  windowMs: MIN15,
  limit: 60,
  keyGenerator: userKey,
  message: 'Too many searches. Please try again later.',
});

// Per-user limiter for routes mounted behind checkAuth.
export const perUserLimiter = ({ name, windowMs = MIN15, limit, message }) =>
  createRateLimiter({ name, windowMs, limit, message, keyGenerator: userKey });
