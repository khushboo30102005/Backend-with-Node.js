import { OAuth2Client } from 'google-auth-library';

// Google ID tokens are verified only here, with Google's own library: it
// checks the signature against Google's public keys, the issuer, the expiry
// and the audience (our client id). Nothing about the identity, including
// whether the email is verified, is ever taken from the request body.
const client_id = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client({
  client_id,
});

export class GoogleAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
  }
}

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

/**
 * Verifies a Google ID token and returns the trusted identity, or throws
 * GoogleAuthError. Rejects tokens whose `email_verified` claim is anything
 * other than the boolean `true` (false, missing, or a string), so an
 * unverified Google address can never sign in or be linked to an existing
 * account with the same email (audit finding M3).
 */
export const verifyIdToken = async (idToken, { verifier = client, audience = client_id } = {}) => {
  // Without an audience the library would accept a token minted for ANY
  // Google client, so refuse to run unconfigured.
  if (!audience) {
    throw new GoogleAuthError('NOT_CONFIGURED', 'Google sign-in is not configured.');
  }
  if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > 4096) {
    throw new GoogleAuthError('INVALID_TOKEN', 'Invalid Google credential.');
  }

  let payload;
  try {
    const ticket = await verifier.verifyIdToken({ idToken, audience });
    payload = ticket.getPayload();
  } catch {
    throw new GoogleAuthError('INVALID_TOKEN', 'Invalid Google credential.');
  }

  if (!payload || !GOOGLE_ISSUERS.has(payload.iss) || typeof payload.sub !== 'string') {
    throw new GoogleAuthError('INVALID_TOKEN', 'Invalid Google credential.');
  }
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(audience)) {
    throw new GoogleAuthError('INVALID_TOKEN', 'Invalid Google credential.');
  }
  if (typeof payload.email !== 'string' || payload.email.length === 0) {
    throw new GoogleAuthError('EMAIL_MISSING', 'Your Google account has no email address.');
  }
  if (payload.email_verified !== true) {
    throw new GoogleAuthError(
      'EMAIL_NOT_VERIFIED',
      'Your Google email address is not verified.',
    );
  }
  return payload;
};
