const isProd = process.env.NODE_ENV === 'production';

// COOKIE_SAMESITE: 'lax' (same site / proxied API) or 'none' (frontend and API on different sites).
// 'none' requires secure cookies, so it is forced on whenever sameSite is 'none'.
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
const secure = isProd || sameSite === 'none';

const baseOptions = {
  httpOnly: true,
  signed: true,
  sameSite,
  secure,
};

export const sessionCookieOptions = (maxAgeMs) => ({
  ...baseOptions,
  maxAge: maxAgeMs,
});

// clearCookie must use the same sameSite/secure/path options the cookie was set with
export const clearSessionCookieOptions = {
  httpOnly: true,
  sameSite,
  secure,
};