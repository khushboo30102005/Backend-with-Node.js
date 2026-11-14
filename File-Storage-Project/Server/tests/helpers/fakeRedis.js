// Minimal in-memory stand-in for the node-redis client, covering only the
// commands the auth code uses. TTLs follow a controllable clock so expiry can
// be tested without waiting. Never connects anywhere.
export function createFakeRedis() {
  const store = new Map(); // key -> { value, expiresAt|null }
  let now = 0;
  const calls = [];

  const alive = (key) => {
    const e = store.get(key);
    if (!e) return undefined;
    if (e.expiresAt !== null && e.expiresAt <= now) {
      store.delete(key);
      return undefined;
    }
    return e;
  };

  const client = {
    calls,
    store,
    advance(seconds) {
      now += seconds * 1000;
    },
    flush() {
      store.clear();
      calls.length = 0;
    },
    keys(prefix = '') {
      return [...store.keys()].filter((k) => alive(k) && k.startsWith(prefix));
    },
    rawGet(key) {
      return alive(key)?.value;
    },

    async get(key) {
      calls.push(['get', key]);
      const e = alive(key);
      return e === undefined ? null : String(e.value);
    },
    async set(key, value, opts = {}) {
      calls.push(['set', key]);
      store.set(key, {
        value: String(value),
        expiresAt: opts.EX ? now + opts.EX * 1000 : null,
      });
      return 'OK';
    },
    async del(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      calls.push(['del', ...list]);
      let n = 0;
      for (const k of list) if (alive(k) && store.delete(k)) n++;
      return n;
    },
    async incr(key) {
      calls.push(['incr', key]);
      const e = alive(key);
      const v = (e ? Number(e.value) : 0) + 1;
      store.set(key, { value: String(v), expiresAt: e ? e.expiresAt : null });
      return v;
    },
    async decr(key) {
      calls.push(['decr', key]);
      const e = alive(key);
      const v = (e ? Number(e.value) : 0) - 1;
      store.set(key, { value: String(v), expiresAt: e ? e.expiresAt : null });
      return v;
    },
    async expire(key, seconds) {
      const e = alive(key);
      if (!e) return 0;
      e.expiresAt = now + seconds * 1000;
      return 1;
    },
    json: {
      async set(key, _path, obj) {
        store.set(key, { value: JSON.parse(JSON.stringify(obj)), expiresAt: null });
        return 'OK';
      },
      async get(key, opts) {
        const e = alive(key);
        if (!e) return null;
        if (opts?.path === '$.userId') return [e.value.userId];
        return e.value;
      },
    },
    ft: {
      async create() {},
      async search(_index, query) {
        const id = /@userId:\{(.+)\}/.exec(query)?.[1];
        const documents = client
          .keys('session:')
          .filter((k) => String(alive(k).value.userId) === id)
          .map((k) => ({ id: k }));
        return { total: documents.length, documents };
      },
    },
  };
  return client;
}
