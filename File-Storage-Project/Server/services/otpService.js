// OTP storage and verification, backed by Redis.
//
// Two kinds of OTP exist:
//  1. Email OTPs (`otp:email:<email>`) prove ownership of an email address.
//     Used by registration, set-password (forgot / no password yet) and
//     change-password. Issued by POST /auth/send-otp.
//  2. Login OTPs live inside a pending-login record
//     (`pending-login:<sha256(token)>`) that is created ONLY after a correct
//     password. The opaque token goes to the browser in a signed httpOnly
//     cookie, so a login OTP can never be used without first passing the
//     password check, and the public send-otp endpoint cannot mint one.
//
// Every OTP is stored as an HMAC (never plaintext), expires after
// OTP_TTL_SECONDS, is deleted after successful use, and is destroyed after
// MAX_OTP_ATTEMPTS wrong guesses. The attempt counter uses atomic INCR, so
// parallel guessing cannot exceed the limit.
import redisClient from '../config/redis.js';
import {
  generateOtp,
  generateToken,
  hashOtp,
  hashToken,
  normalizeEmail,
  otpMatches,
} from '../utils/otpCrypto.js';

export const OTP_TTL_SECONDS = 10 * 60;
export const PENDING_LOGIN_TTL_SECONDS = 10 * 60;
export const MAX_OTP_ATTEMPTS = 5;

export const otpFailureMessage = (result) =>
  result.reason === 'locked'
    ? 'Too many incorrect attempts. Please request a new OTP.'
    : 'Invalid or expired OTP.';

const emailOtpKey = (email) => `otp:email:${normalizeEmail(email)}`;
const pendingLoginKey = (token) => `pending-login:${hashToken(token)}`;
const pendingLoginUserKey = (userId) => `pending-login-user:${userId}`;
const attemptsKey = (key) => `${key}:attempts`;

// Result reasons: 'invalid' (wrong / expired / unknown) or 'locked'
// (attempt limit reached; the OTP has been destroyed).
async function checkAgainst(key, otp, { consume, readHash, ttl }) {
  const raw = await redisClient.get(key);
  if (!raw) return { ok: false, reason: 'invalid' };
  const parsed = readHash(raw);
  if (!parsed) return { ok: false, reason: 'invalid' };

  const aKey = attemptsKey(key);
  const attempts = await redisClient.incr(aKey);
  if (attempts === 1) await redisClient.expire(aKey, ttl);
  if (attempts > MAX_OTP_ATTEMPTS) {
    await redisClient.del([key, aKey]);
    return { ok: false, reason: 'locked' };
  }

  if (!parsed.extraCheck() || !otpMatches(key, otp, parsed.hash)) {
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await redisClient.del([key, aKey]);
      return { ok: false, reason: 'locked' };
    }
    return {
      ok: false,
      reason: 'invalid',
      attemptsLeft: MAX_OTP_ATTEMPTS - attempts,
    };
  }

  if (consume) {
    // DEL is atomic: of two concurrent correct submissions only one wins.
    const removed = await redisClient.del(key);
    await redisClient.del(aKey);
    if (removed !== 1) return { ok: false, reason: 'invalid' };
  } else {
    // A successful non-consuming check is not a failed attempt.
    await redisClient.decr(aKey);
  }
  return { ok: true, record: parsed.record };
}

// ---------------------------------------------------------------- email OTP

export async function issueEmailOtp(email) {
  const key = emailOtpKey(email);
  const otp = generateOtp();
  await redisClient.set(key, hashOtp(key, otp), { EX: OTP_TTL_SECONDS });
  await redisClient.del(attemptsKey(key)); // fresh code, fresh attempt budget
  return otp;
}

const plainHash = (raw) => ({ hash: raw, extraCheck: () => true, record: null });

// Non-consuming check, used by the "Verify" button before the final submit
// (register / set-password). Wrong guesses still count toward the limit.
export async function checkEmailOtp(email, otp) {
  return checkAgainst(emailOtpKey(email), otp, {
    consume: false,
    readHash: plainHash,
    ttl: OTP_TTL_SECONDS,
  });
}

// Single-use: the OTP is deleted on success.
export async function consumeEmailOtp(email, otp) {
  return checkAgainst(emailOtpKey(email), otp, {
    consume: true,
    readHash: plainHash,
    ttl: OTP_TTL_SECONDS,
  });
}

// ------------------------------------------------------------ pending login

// Call ONLY after the password has been verified. Replaces any earlier
// pending login for the same user, so only the newest one is usable.
export async function createPendingLogin(user) {
  const userId = String(user._id);
  const token = generateToken();
  const key = pendingLoginKey(token);
  const otp = generateOtp();

  const userKey = pendingLoginUserKey(userId);
  const previous = await redisClient.get(userKey);
  if (previous) await redisClient.del([previous, attemptsKey(previous)]);

  await redisClient.set(
    key,
    JSON.stringify({
      userId,
      email: normalizeEmail(user.email),
      otpHash: hashOtp(key, otp),
    }),
    { EX: PENDING_LOGIN_TTL_SECONDS },
  );
  await redisClient.set(userKey, key, { EX: PENDING_LOGIN_TTL_SECONDS });
  return { token, otp };
}

// Verifies the login OTP against the pending login that `token` names and
// consumes it. Returns { ok: true, userId } on success.
export async function consumePendingLogin(token, email, otp) {
  if (typeof token !== 'string' || !token) {
    return { ok: false, reason: 'invalid' };
  }
  const key = pendingLoginKey(token);
  const result = await checkAgainst(key, otp, {
    consume: true,
    ttl: PENDING_LOGIN_TTL_SECONDS,
    readHash: (raw) => {
      try {
        const record = JSON.parse(raw);
        return {
          hash: record.otpHash,
          record,
          extraCheck: () => record.email === normalizeEmail(email),
        };
      } catch {
        return null;
      }
    },
  });
  if (!result.ok) return result;
  const userKey = pendingLoginUserKey(result.record.userId);
  if ((await redisClient.get(userKey)) === key) await redisClient.del(userKey);
  return { ok: true, userId: result.record.userId };
}
