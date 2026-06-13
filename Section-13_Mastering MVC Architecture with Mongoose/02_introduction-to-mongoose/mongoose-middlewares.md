# Mongoose Middlewares (Hooks)

Mongoose middlewares, also known as **pre** or **post hooks**, are functions executed before or after certain operations in Mongoose. They allow you to modify data, perform validations, and handle side effects before or after executing a query or saving a document.

Mongoose provides four types of middlewares:

1. **Document Middleware**
2. **Query Middleware**
3. **Model Middleware**
4. **Aggregate Middleware**

---

## 1. Document Middleware

Document middleware runs before or after a document is saved, validated, removed, or initialized.

### Example: Pre-save Middleware

```js
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);
```

- The `pre('save')` middleware runs **before saving** a user.
- It hashes the password before storing it in the database.

### Example: Post-save Middleware

```js
userSchema.post('save', function (doc, next) {
  console.log(`New user created: ${doc.username}`);
  next();
});
```

- The `post('save')` middleware runs **after saving** a document.
- It logs a message after a new user is created.

---

## 2. Query Middleware

Query middleware runs before or after a query executes. It is useful for automatically modifying queries.

### Example: Pre-find Middleware

```js
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
```

- The `pre(/^find/)` middleware runs before **any find query (`find`, `findOne`, etc.)**.
- It automatically excludes documents where `active` is `false`.

### Example: Post-find Middleware

```js
userSchema.post('find', function (docs, next) {
  console.log(`${docs.length} documents found`);
  next();
});
```

- The `post('find')` middleware runs **after a find query executes**.
- It logs the number of documents found.

---

## 3. Model Middleware

Model middleware runs before or after specific model-level operations such as `insertMany`.

### Example: Pre-insertMany Middleware

```js
userSchema.pre('insertMany', function (next, docs) {
  docs.forEach(doc => {
    doc.createdAt = new Date();
  });
  next();
});
```

- The `pre('insertMany')` middleware runs **before inserting multiple documents**.
- It adds a `createdAt` timestamp to each document before insertion.

### Example: Post-insertMany Middleware

```js
userSchema.post('insertMany', function (docs, next) {
  console.log(`${docs.length} users inserted.`);
  next();
});
```

- The `post('insertMany')` middleware runs **after multiple documents are inserted**.
- It logs how many users were inserted.

---

## 4. Aggregate Middleware

Aggregate middleware runs before or after an aggregation pipeline executes.

### Example: Pre-aggregate Middleware

```js
userSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});
```

- The `pre('aggregate')` middleware runs **before executing an aggregation pipeline**.
- It automatically excludes deleted documents (`isDeleted: true`).

### Example: Post-aggregate Middleware

```js
userSchema.post('aggregate', function (result, next) {
  console.log(`Aggregation completed with ${result.length} results`);
  next();
});
```

- The `post('aggregate')` middleware runs **after an aggregation pipeline executes**.
- It logs the number of results returned.

---

## Summary

| Middleware Type       | Runs Before (`pre`) | Runs After (`post`) |
|----------------------|------------------|-----------------|
| **Document**        | `save`, `validate`, `remove`, `init` | `save`, `remove` |
| **Query**           | `find`, `findOne`, `findOneAndUpdate`, etc. | `find`, `findOne`, etc. |
| **Model**           | `insertMany` | `insertMany` |
| **Aggregate**       | `aggregate` | `aggregate` |

Mongoose middlewares provide a powerful way to hook into the lifecycle of operations and manipulate data efficiently. By using **pre** and **post** hooks, we can enhance security, log events, and enforce consistency in our database operations.
