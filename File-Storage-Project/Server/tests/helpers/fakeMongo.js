// In-memory stand-in for Mongoose models, covering only the query and update
// operators the storage code uses. Never connects anywhere.
//
// Concurrency model: every operation first yields to the event loop (so
// parallel requests interleave between operations, as they do against a real
// server), then matches and updates synchronously. That mirrors MongoDB's
// guarantee that a single-document update is atomic, which is exactly the
// property the quota reservation relies on.
import mongoose from 'mongoose';

const tick = () => new Promise((resolve) => setImmediate(resolve));

const isObjectId = (v) => v instanceof mongoose.Types.ObjectId;
const norm = (v) => {
  if (isObjectId(v)) return v.toHexString();
  if (v instanceof Date) return v.getTime();
  return v;
};
const eq = (a, b) => norm(a) === norm(b);
const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && !isObjectId(v) && !(v instanceof Date);

function clone(v) {
  if (Array.isArray(v)) return v.map(clone);
  if (isObjectId(v)) return new mongoose.Types.ObjectId(v.toHexString());
  if (v instanceof Date) return new Date(v.getTime());
  if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v;
}

// All values at a dotted path; arrays along the way fan out (like MongoDB).
function valuesAt(doc, path) {
  let current = [doc];
  for (const seg of path.split('.')) {
    const next = [];
    for (const c of current) {
      if (Array.isArray(c)) {
        for (const el of c) if (el && typeof el === 'object') next.push(el[seg]);
      } else if (c && typeof c === 'object') {
        next.push(c[seg]);
      } else {
        next.push(undefined);
      }
    }
    current = next;
  }
  // A field holding an array matches its elements too.
  return current.flatMap((v) => (Array.isArray(v) ? [v, ...v] : [v]));
}

const cmp = (a, b) => {
  const x = norm(a);
  const y = norm(b);
  return x < y ? -1 : x > y ? 1 : 0;
};

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === '$or') return cond.some((f) => matches(doc, f));
    if (key === '$and') return cond.every((f) => matches(doc, f));
    const values = valuesAt(doc, key);
    const isOps = isPlainObject(cond) && Object.keys(cond).every((k) => k.startsWith('$'));
    if (!isOps) return values.some((v) => eq(v, cond));
    return Object.entries(cond).every(([op, arg]) => {
      switch (op) {
        case '$ne':
          return !values.some((v) => eq(v, arg));
        case '$in':
          return values.some((v) => arg.some((a) => eq(v, a)));
        case '$nin':
          return !values.some((v) => arg.some((a) => eq(v, a)));
        case '$lt':
          return values.some((v) => v != null && cmp(v, arg) < 0);
        case '$lte':
          return values.some((v) => v != null && cmp(v, arg) <= 0);
        case '$gt':
          return values.some((v) => v != null && cmp(v, arg) > 0);
        case '$gte':
          return values.some((v) => v != null && cmp(v, arg) >= 0);
        case '$regex': {
          const re = new RegExp(arg, cond.$options || '');
          return values.some((v) => typeof v === 'string' && re.test(v));
        }
        case '$options':
          return true; // read by $regex
        case '$exists':
          return values.some((v) => v !== undefined) === Boolean(arg);
        case '$elemMatch': {
          const arr = valuesAt(doc, key).find(Array.isArray) || [];
          return arr.some((el) => matches(el, arg));
        }
        default:
          throw new Error(`fakeMongo: unsupported operator ${op}`);
      }
    });
  });
}

function setPath(doc, path, value) {
  const segs = path.split('.');
  let cur = doc;
  for (const s of segs.slice(0, -1)) {
    if (cur[s] === undefined) cur[s] = {};
    cur = cur[s];
  }
  cur[segs.at(-1)] = value;
}
const getPath = (doc, path) => path.split('.').reduce((c, s) => (c == null ? c : c[s]), doc);

// Resolves "arr.$.field" to "arr.<index>.field" using the query filter.
function resolvePositional(doc, path, filter) {
  if (!path.includes('.$')) return path;
  const [arrPath, rest] = path.split('.$');
  const arr = getPath(doc, arrPath) || [];
  const sub = {};
  for (const [k, v] of Object.entries(filter)) {
    if (k === arrPath && isPlainObject(v) && v.$elemMatch) Object.assign(sub, v.$elemMatch);
    else if (k.startsWith(`${arrPath}.`)) sub[k.slice(arrPath.length + 1)] = v;
  }
  const idx = arr.findIndex((el) => matches(el, sub));
  if (idx < 0) throw new Error(`fakeMongo: positional operator matched nothing for ${path}`);
  return `${arrPath}.${idx}${rest}`;
}

function applyUpdate(doc, update, filter) {
  const ops = Object.keys(update).some((k) => k.startsWith('$')) ? update : { $set: update };
  for (const [op, fields] of Object.entries(ops)) {
    for (const [rawPath, value] of Object.entries(fields)) {
      const path = resolvePositional(doc, rawPath, filter);
      switch (op) {
        case '$set':
          setPath(doc, path, clone(value));
          break;
        case '$unset':
          setPath(doc, path, undefined);
          break;
        case '$inc':
          setPath(doc, path, (getPath(doc, path) ?? 0) + value);
          break;
        case '$push': {
          const arr = getPath(doc, path) ?? [];
          arr.push(clone(value));
          setPath(doc, path, arr);
          break;
        }
        case '$pull': {
          const arr = getPath(doc, path) ?? [];
          setPath(doc, path, arr.filter((el) => !matches(el, value)));
          break;
        }
        default:
          throw new Error(`fakeMongo: unsupported update operator ${op}`);
      }
    }
  }
  doc.updatedAt = new Date();
}

// Fake models by name, so populate() can follow `refs`.
const registry = new Map();

export function createFakeModel(name, { defaults = {}, hidden = [], refs = {} } = {}) {
  const docs = new Map(); // hex id -> stored doc
  const failures = []; // { method, error, when? }

  const takeFailure = (method, args) => {
    const i = failures.findIndex((f) => f.method === method && (!f.when || f.when(...args)));
    if (i < 0) return null;
    return failures.splice(i, 1)[0].error;
  };

  const all = () => [...docs.values()];
  const find = (filter) => all().filter((d) => matches(d, filter));

  const project = (doc, select) => {
    const out = clone(doc);
    const wanted = String(select || '');
    for (const h of hidden) if (!wanted.includes(`+${h}`)) delete out[h];
    return out;
  };

  const hydrate = (doc) => {
    if (!doc) return null;
    const live = docs.get(norm(doc._id));
    Object.defineProperties(doc, {
      save: {
        value: async () => {
          await tick();
          const { save, deleteOne, ...data } = doc; // eslint-disable-line no-unused-vars
          docs.set(norm(doc._id), { ...(live || {}), ...clone(data), updatedAt: new Date() });
          return doc;
        },
      },
      deleteOne: {
        value: async () => {
          await tick();
          docs.delete(norm(doc._id));
          return { deletedCount: 1 };
        },
      },
      id: { get: () => String(doc._id) },
    });
    return doc;
  };

  // Thenable query: chain methods are recorded, the operation runs on await.
  // populate(path, select) on lean results: replaces the id with a copy of
  // the referenced document (or null), like Mongoose. Select is ignored.
  const populateDoc = (doc, paths) => {
    for (const path of paths) {
      const ref = registry.get(refs[path]);
      if (!ref || doc[path] == null) continue;
      doc[path] = ref.get(doc[path]);
    }
    return doc;
  };

  const query = (run, { many = false } = {}) => {
    const state = { select: '', lean: false, limit: null, populate: [] };
    const q = {
      select(s) {
        state.select = typeof s === 'string' ? s : '';
        return q;
      },
      lean() {
        state.lean = true;
        return q;
      },
      limit(n) {
        state.limit = n;
        return q;
      },
      sort() {
        return q;
      },
      session() {
        return q;
      },
      populate(path) {
        if (typeof path === 'string') state.populate.push(path);
        return q;
      },
      exec() {
        return q.then();
      },
      then(onOk, onErr) {
        return (async () => {
          await tick();
          let result = run();
          if (many) {
            if (state.limit) result = result.slice(0, state.limit);
            return result.map((d) =>
              state.lean
                ? populateDoc(project(d, state.select), state.populate)
                : hydrate(project(d, state.select)),
            );
          }
          if (!result) return null;
          const out = project(result, state.select);
          return state.lean ? populateDoc(out, state.populate) : hydrate(out);
        })().then(onOk, onErr);
      },
    };
    return q;
  };

  const model = {
    modelName: name,
    docs,
    failures,
    reset() {
      docs.clear();
      failures.length = 0;
    },
    /** Seeds a document synchronously (test setup). */
    insert(data) {
      const doc = {
        _id: new mongoose.Types.ObjectId(),
        ...clone(defaults),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...clone(data),
      };
      docs.set(norm(doc._id), doc);
      return clone(doc);
    },
    get(id) {
      const d = docs.get(norm(id));
      return d ? clone(d) : null;
    },
    /** Makes the next matching call to `method` reject with `error`. */
    failNext(method, error = new Error(`${name}.${method} failed (injected)`), when) {
      failures.push({ method, error, when });
    },

    async create(data) {
      await tick();
      const err = takeFailure('create', [data]);
      if (err) throw err;
      if (data._id && docs.has(norm(data._id))) {
        throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
      }
      return hydrate(clone(model.insert(data)));
    },
    find(filter = {}) {
      return query(() => find(filter), { many: true });
    },
    findOne(filter = {}) {
      return query(() => find(filter)[0] ?? null);
    },
    findById(id) {
      return model.findOne({ _id: id });
    },
    findOneAndUpdate(filter, update, opts = {}) {
      const after = opts.new === true || opts.returnDocument === 'after';
      return query(() => {
        const err = takeFailure('findOneAndUpdate', [filter, update]);
        if (err) throw err;
        const doc = find(filter)[0];
        if (!doc) return null;
        const before = clone(doc);
        applyUpdate(doc, update, filter);
        return after ? doc : before;
      });
    },
    findByIdAndUpdate(id, update, opts) {
      return model.findOneAndUpdate({ _id: id }, update, opts);
    },
    async updateOne(filter, update) {
      await tick();
      const err = takeFailure('updateOne', [filter, update]);
      if (err) throw err;
      const doc = find(filter)[0];
      if (!doc) return { matchedCount: 0, modifiedCount: 0 };
      const before = JSON.stringify(doc);
      applyUpdate(doc, update, filter);
      // updatedAt always changes; compare without it.
      const changed = before !== JSON.stringify({ ...doc, updatedAt: JSON.parse(before).updatedAt });
      return { matchedCount: 1, modifiedCount: changed ? 1 : 0 };
    },
    async updateMany(filter, update) {
      await tick();
      const err = takeFailure('updateMany', [filter, update]);
      if (err) throw err;
      const list = find(filter);
      for (const d of list) applyUpdate(d, update, filter);
      return { matchedCount: list.length, modifiedCount: list.length };
    },
    async deleteOne(filter) {
      await tick();
      const err = takeFailure('deleteOne', [filter]);
      if (err) throw err;
      const doc = find(filter)[0];
      if (!doc) return { deletedCount: 0 };
      docs.delete(norm(doc._id));
      return { deletedCount: 1 };
    },
    async deleteMany(filter) {
      await tick();
      const err = takeFailure('deleteMany', [filter]);
      if (err) throw err;
      const list = find(filter);
      for (const d of list) docs.delete(norm(d._id));
      return { deletedCount: list.length };
    },
    async exists(filter) {
      await tick();
      const doc = find(filter)[0];
      return doc ? { _id: doc._id } : null;
    },
    async countDocuments(filter) {
      await tick();
      return find(filter).length;
    },
    async bulkWrite(ops) {
      await tick();
      const err = takeFailure('bulkWrite', [ops]);
      if (err) throw err;
      for (const op of ops) {
        if (!op.updateOne) throw new Error('fakeMongo: only updateOne bulk ops are supported');
        const doc = find(op.updateOne.filter)[0];
        if (doc) applyUpdate(doc, op.updateOne.update, op.updateOne.filter);
      }
      return { ok: 1 };
    },
    async aggregate() {
      await tick();
      return [];
    },
    /** Test helpers for createFakeTransactions(). */
    snapshot() {
      return new Map([...docs].map(([k, v]) => [k, clone(v)]));
    },
    restore(snap) {
      docs.clear();
      for (const [k, v] of snap) docs.set(k, v);
    },
  };
  registry.set(name, model);
  return model;
}

// Stand-in for utils/transaction.js. Transactions run one at a time (a
// stand-in for MongoDB's isolation and write-conflict retries), and a
// callback that throws has every listed model restored to the state before it
// started, like an aborted transaction. `stats` lets tests check that an
// operation really ran inside a transaction.
export function createFakeTransactions(models) {
  const stats = { committed: 0, aborted: 0 };
  let queue = Promise.resolve();
  async function runInTransaction(fn) {
    const turn = queue.then(async () => {
      const snaps = models.map((m) => m.snapshot());
      try {
        const result = await fn();
        stats.committed++;
        return result;
      } catch (err) {
        models.forEach((m, i) => m.restore(snaps[i]));
        stats.aborted++;
        throw err;
      }
    });
    queue = turn.catch(() => {});
    return turn;
  }
  return { runInTransaction, resetTransactionSupport() {}, stats };
}
