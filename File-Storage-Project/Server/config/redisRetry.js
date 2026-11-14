// Reconnect policy for the Redis client (audit M10).
//
// The previous strategy returned an Error after 30 attempts (about a minute),
// which makes node-redis stop reconnecting for good: after any outage longer
// than that, sessions, OTPs and rate limits stayed broken until the process
// was restarted by hand. This one never gives up. It backs off exponentially
// (100 ms, 200 ms, 400 ms ... capped at 30 s) with "equal jitter", so a fleet
// of instances doesn't reconnect in lockstep and hammer a recovering server.
export const RETRY_BASE_MS = 100;
export const RETRY_MAX_MS = 30 * 1000;

export function reconnectDelay(retries, { random = Math.random } = {}) {
  const attempt = Math.max(0, Math.min(Number(retries) || 0, 30));
  const ceiling = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** attempt);
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}
