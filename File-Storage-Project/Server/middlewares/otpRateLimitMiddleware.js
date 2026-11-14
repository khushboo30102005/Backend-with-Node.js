// Redis-backed fixed-window rate limiting keyed on BOTH the client IP and the
// target identity (email, or user id for signed-in routes). Shared across
// server instances, unlike the in-memory express-rate-limit limiters, and an
// attacker rotating IPs is still capped per target account.
import redisClient from '../config/redis.js';
import { normalizeEmail } from '../utils/otpCrypto.js';

async function hit(key, windowSec) {
  const count = await redisClient.incr(key);
  if (count === 1) await redisClient.expire(key, windowSec);
  return count;
}

const bodyEmail = (req) => normalizeEmail(req.body?.email) || null;

export function emailAndIpLimiter({
  name,
  windowSec = 15 * 60,
  identityLimit,
  ipLimit,
  identity = bodyEmail,
  message = 'Too many attempts. Please try again later.',
}) {
  return async function otpRateLimit(req, res, next) {
    try {
      const id = identity(req);
      const [ipCount, idCount] = await Promise.all([
        hit(`rl:${name}:ip:${req.ip}`, windowSec),
        id ? hit(`rl:${name}:id:${id}`, windowSec) : 0,
      ]);
      if (ipCount > ipLimit || idCount > identityLimit) {
        res.set('Retry-After', String(windowSec));
        return res.status(429).json({ error: message });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

const WINDOW = 15 * 60;

export const sendOtpRateLimit = emailAndIpLimiter({
  name: 'send-otp',
  windowSec: WINDOW,
  identityLimit: 3,
  ipLimit: 10,
  message: 'Too many OTP requests. Please try again later.',
});

// Password login also emails a login OTP, so it is limited the same way.
export const loginRateLimit = emailAndIpLimiter({
  name: 'login',
  windowSec: WINDOW,
  identityLimit: 10,
  ipLimit: 30,
  message: 'Too many login attempts. Please try again later.',
});

export const verifyOtpRateLimit = emailAndIpLimiter({
  name: 'verify-otp',
  windowSec: WINDOW,
  identityLimit: 10,
  ipLimit: 30,
  message: 'Too many verification attempts. Please try again later.',
});

export const changePasswordRateLimit = emailAndIpLimiter({
  name: 'change-password',
  windowSec: WINDOW,
  identityLimit: 10,
  ipLimit: 30,
  identity: (req) => (req.user?._id ? String(req.user._id) : null),
  message: 'Too many attempts. Please try again later.',
});
