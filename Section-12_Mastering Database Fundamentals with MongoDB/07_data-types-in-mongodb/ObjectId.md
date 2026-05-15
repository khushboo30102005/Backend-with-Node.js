## **ObjectId**

#### 🔷 What is ObjectId?

ObjectId is a 12-byte unique identifier used by MongoDB, mostly for the \_id field of documents.

### 🔷 Structure of ObjectId

**An ObjectId is not random — it has 4 parts:**

```
69f6ee46  8e62cf2c9336  82d1
|------|  |-----------|  |----|
   4B         5B          3B
```

### 1️⃣ Timestamp (First 4 bytes)

`69f6ee46`

- Represents creation time
- Stored as Unix timestamp (seconds)

**👉 Means you can extract when document was created**

```js
test> const oId = ObjectId()
test> oId
ObjectId('69f6efd58e62cf2c933682d2')
test> oId.getTimestamp()
ISODate('2026-05-03T06:48:53.000Z')
```

### 2️⃣ Machine + Process Info (Next 5 bytes)

`8e62cf2c9336`

- Ensures uniqueness across:
- different machines
- different processes
### 3️⃣ Counter (Last 3 bytes)
`82d1`
- Incremental value
- Ensures uniqueness even if multiple IDs are created at same second
