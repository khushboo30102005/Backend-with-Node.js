# Cursor

A **cursor** is an object that points to the result set of a query and let you fetch the data step by step instead of all at once.

## Why cursor is needed?

when you run:

```js
collection.find();
```

MongoDB does not return all data immediately.

Instead:  
👉 It returns a cursor

**Why?**

- Data can be very large (millions of documents)
- Loading everything = ❌ slow + ❌ memory heavy

- So MongoDB uses:
  👉 Lazy loading (fetch in batches)

### Real-Life Analogy

👉 Imagine Instagram feed:

- You don’t load all posts at once ❌
- You scroll → more posts load ✔

👉 That scrolling system = Cursor
