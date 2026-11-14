// Shared rate-limit store for express-rate-limit (audit M5).
//
// The default MemoryStore keeps counters in the Node process, so every restart
// or redeploy reset all limits and each instance counted on its own. This
// store keeps the counters in Redis, shared by every instance and surviving
// restarts.
//
// Counting is a fixed window per key: INCR, and the first hit of a window sets
// the expiry. If a previous request died between INCR and PEXPIRE, the key is
// left without a TTL; the next hit notices (PTTL < 0) and sets it, so a key
// can never block a client forever.
//
// Redis outage: limiting must neither stop (fail open) nor take the whole API
// down (fail closed). While Redis is unavailable each store falls back to its
// own in-process MemoryStore, i.e. the pre-M5 behaviour, and goes back to
// Redis as soon as the client is ready again. The readiness check matters:
// node-redis queues commands while reconnecting, which would otherwise make
// every request hang until Redis came back.
import { MemoryStore } from 'express-rate-limit';
import redisClient from '../config/redis.js';

const WARN_INTERVAL_MS = 60 * 1000;
let lastWarned = 0;
function warnFallback(prefix, err) {
  if (Date.now() - lastWarned < WARN_INTERVAL_MS) return;
  lastWarned = Date.now();
  console.warn(
    `[rate-limit] Redis unavailable (${err?.code || err?.message || 'not ready'}); ` +
      `using in-memory counters for ${prefix}* until it reconnects`,
  );
}

export class RedisRateLimitStore {
  /**
   * @param {object} opts
   * @param {string} opts.prefix  unique per limiter, e.g. 'rl:api:'
   * @param {object} [opts.client] node-redis client (defaults to the app's)
   */
  constructor({ prefix, client = redisClient }) {
    if (!prefix) throw new Error('RedisRateLimitStore: prefix is required');
    this.prefix = prefix;
    this.client = client;
    this.localKeys = false;
    this.fallback = new MemoryStore();
    this.windowMs = 60 * 1000;
  }

  init(options) {
    this.windowMs = options.windowMs;
    this.fallback.init(options);
  }

  #available() {
    // Fakes used in tests may not expose isReady; treat them as ready.
    return this.client && this.client.isReady !== false;
  }

  async increment(key) {
    if (!this.#available()) {
      warnFallback(this.prefix);
      return this.fallback.increment(key);
    }
    const redisKey = this.prefix + key;
    try {
      const totalHits = Number(await this.client.incr(redisKey));
      let ttl = Number(await this.client.pTTL(redisKey));
      if (totalHits === 1 || !(ttl > 0)) {
        await this.client.pExpire(redisKey, this.windowMs);
        ttl = this.windowMs;
      }
      return { totalHits, resetTime: new Date(Date.now() + ttl) };
    } catch (err) {
      warnFallback(this.prefix, err);
      return this.fallback.increment(key);
    }
  }

  async decrement(key) {
    if (!this.#available()) return this.fallback.decrement(key);
    try {
      await this.client.decr(this.prefix + key);
    } catch {
      await this.fallback.decrement(key);
    }
  }

  async resetKey(key) {
    await this.fallback.resetKey(key);
    if (!this.#available()) return;
    try {
      await this.client.del(this.prefix + key);
    } catch {
      // nothing else to do; the key expires with its window
    }
  }

  shutdown() {
    this.fallback.shutdown();
  }
}
