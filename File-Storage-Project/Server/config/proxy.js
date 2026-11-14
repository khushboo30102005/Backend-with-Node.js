// Number of reverse proxies in front of the API, for Express's `trust proxy`
// (audit M5). req.ip, and with it every per-IP rate limit, is the address
// that many hops from the right of X-Forwarded-For:
//   too low  -> req.ip is a proxy's address and users share one bucket;
//   too high -> req.ip comes from a header the client wrote and can be spoofed.
// The production chain is browser -> Vercel rewrite -> Render's edge -> app;
// confirm the hop count against Render's request logs and set
// TRUST_PROXY_HOPS there. Unset keeps the previous default of 1.
export const DEFAULT_TRUST_PROXY_HOPS = 1;
const MAX_HOPS = 5;

export function trustProxyHops(raw = process.env.TRUST_PROXY_HOPS) {
  if (raw === undefined || String(raw).trim() === '') return DEFAULT_TRUST_PROXY_HOPS;
  const value = String(raw).trim();
  // Only a plain small integer. "true" would trust every hop (spoofable) and
  // the old `Number(x) || 1` silently turned "0" into 1.
  if (!/^\d+$/.test(value) || Number(value) > MAX_HOPS) {
    throw new Error(`TRUST_PROXY_HOPS must be an integer from 0 to ${MAX_HOPS}, got "${value}"`);
  }
  return Number(value);
}
