// In-memory stand-in for the Mongoose User model (only what auth code uses).
// Supports `await User.findOne(f)`, `.select(...)`, `.lean()` chains.
export function createFakeUserModel() {
  const users = new Map(); // _id -> doc

  const makeDoc = (data) => {
    const doc = {
      role: 'User',
      isDeleted: false,
      maxStorageInBytes: 1024,
      picture: 'https://example.test/default.png',
      ...data,
      get id() {
        return String(this._id);
      },
      async comparePassword(candidate) {
        return Boolean(this.password) && candidate === this.password;
      },
      async save() {
        users.set(String(this._id), this);
        return this;
      },
    };
    return doc;
  };

  const query = (resolveDoc) => {
    let lean = false;
    const q = {
      select() {
        return q;
      },
      lean() {
        lean = true;
        return q;
      },
      then(onOk, onErr) {
        return Promise.resolve()
          .then(() => {
            const doc = resolveDoc();
            if (!doc) return null;
            return lean ? { ...doc } : doc;
          })
          .then(onOk, onErr);
      },
    };
    return q;
  };

  const User = {
    users,
    reset() {
      users.clear();
    },
    add(data) {
      const doc = makeDoc(data);
      users.set(String(doc._id), doc);
      return doc;
    },
    findOne(filter = {}) {
      return query(() =>
        [...users.values()].find((u) =>
          Object.entries(filter).every(([k, v]) => u[k] === v),
        ),
      );
    },
    findById(id) {
      return query(() => users.get(String(id)));
    },
    async findByIdAndUpdate(id, update) {
      const u = users.get(String(id));
      if (u) Object.assign(u, update);
      return u ?? null;
    },
  };
  return User;
}
