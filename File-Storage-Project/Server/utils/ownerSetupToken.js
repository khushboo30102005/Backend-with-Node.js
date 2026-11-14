// Setup-token helpers for the initial Owner setup. Dependency free so the
// token generator runs without a database or Redis connection.
import crypto from 'node:crypto';

export function hashSetupToken(token) {
  return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
}

/** 256-bit random token for the operator, plus the hash to configure. */
export function generateSetupToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashSetupToken(token) };
}
