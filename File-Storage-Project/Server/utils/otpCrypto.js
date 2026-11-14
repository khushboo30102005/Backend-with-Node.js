import crypto from 'node:crypto';

export const OTP_LENGTH = 6;
const OTP_SPACE = 10 ** OTP_LENGTH;

// Uniformly random 6-digit code from the OS CSPRNG (leading zeros kept).
export function generateOtp() {
  return crypto.randomInt(0, OTP_SPACE).toString().padStart(OTP_LENGTH, '0');
}

function otpSecret() {
  const secret = process.env.OTP_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('OTP_SECRET or SESSION_SECRET must be set to hash OTPs.');
  }
  return secret;
}

// OTPs are stored only as a keyed HMAC. A plain SHA-256 of a 6-digit code
// could be reversed offline in milliseconds; the server-side key prevents that
// if the store ever leaks. `scope` (the storage key) binds a hash to one
// purpose + identity so it cannot be replayed elsewhere.
export function hashOtp(scope, otp) {
  return crypto
    .createHmac('sha256', otpSecret())
    .update(`${scope}\0${otp}`)
    .digest('hex');
}

export function otpMatches(scope, otp, storedHash) {
  if (typeof otp !== 'string' || typeof storedHash !== 'string') return false;
  const a = Buffer.from(hashOtp(scope, otp), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// High-entropy opaque token (256 bits). Only its SHA-256 is stored server side.
export function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}
