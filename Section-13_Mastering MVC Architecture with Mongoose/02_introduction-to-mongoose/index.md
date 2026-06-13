# Index:

"An index is a separate data structure associated with a collection that stores indexed field values along with references to the documents containing those values.

## `unique: true` and `index: true`:

In Mongoose, `unique: true` and `index: true` are related to MongoDB indexes, but they serve different purposes.

## 1. index: true

```js
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    index: true,
  },
});
```

### What it does

- It tells MongoDB to create a normal index on the `email` field.

- An index works like the index section at the end of a book. Instead of scanning every document in a collection, MongoDB can quickly locate documents using the indexed field.

- Benefits
  - Faster searching
  - Faster sorting
  - Faster filtering
  - Example:
    ```js
    User.find({ email: 'abc@gmail.com' });
    ```

- Without an index:
  - MongoDB performs a collection scan (checks every document).

- With an index:
  - MongoDB uses the index to find matching documents much faster.
    Important point

- index: true does NOT prevent duplicates.

## 2. `unique: true`:

```js
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
});
```

### What it does

- It creates a unique index in MongoDB.

- A unique index ensures that no two documents can have the same value for that field.

- Example

- First insert:

```js
{
  email: 'abc@gmail.com';
}
```

**✅ Success**

- Second insert:

```js
{
  email: 'abc@gmail.com';
}
```

**❌ Error**

```js
E11000 duplicate key error
```

because the value already exists.

- Is `unique` a validator?

Many beginners think this:

```js
email: {
  type: String,
  unique: true
}
```

means Mongoose validates uniqueness before saving.

It does not.

`unique: true` simply tells MongoDB to create a unique index.

The duplicate check happens at the database level, not through Mongoose validation.

That's why duplicate errors are usually `MongoServerError`, not `ValidationError`.

### Internally

```js
email: {
  unique: true;
}
```

is roughly equivalent to creating this MongoDB index:

```js
db.users.createIndex({ email: 1 }, { unique: true });
```
