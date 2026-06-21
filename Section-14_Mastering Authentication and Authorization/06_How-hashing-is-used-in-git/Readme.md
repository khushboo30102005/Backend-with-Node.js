# Understanding How Git Stores Files Using SHA-1 Hashing

## Introduction

When we run:

```bash
git add file.txt
```

Git does **not** store the file directly.

Instead, Git:

1. Creates a Git object.
2. Calculates a SHA-1 hash for that Git object (the blob object containing the file content and header), not just for the committed file itself.
3. Compresses the object.
4. Stores it inside `.git/objects`.

Understanding this process helps us understand how Git tracks changes internally.

---

# Step 1: Read the File

Suppose we have a file:

```text
hii.txt
```

Contents:

```text
Hello World
```

Read it using Node.js:

```js
import { readFileSync } from 'node:fs'

const fileData = readFileSync('hii.txt')
```

`fileData` is a Buffer containing the file contents.

---

# Step 2: Create a Git Blob Object

Git does not hash only the file content.

It first creates a header:

```text
blob <size>\0
```

For our file:

```text
Hello World
```

Length:

```text
11
```

Header becomes:

```text
blob 11\0
```

Node.js code:

```js
const header = Buffer.from(`blob ${fileData.length}\0`)
```

---

# Step 3: Combine Header and File Data

Git combines:

```text
blob 11\0
```

with

```text
Hello World
```

Result:

```text
blob 11\0Hello World
```

Node.js:

```js
const newData = Buffer.concat([
    header,
    fileData
])
```

This combined data is the actual Git object.

---

# Step 4: Calculate SHA-1 Hash

Git generates a SHA-1 hash from the entire object.

Node.js:

```js
import crypto from 'node:crypto'

const hash = crypto
    .createHash('sha1')
    .update(newData)
    .digest('hex')

console.log(hash)
```

Example output:

```text
e965047ad7c57865823c7d992b1d046ea66edf78
```

This hash uniquely identifies the object.

---

# Step 5: Verify With Git

Run:

```bash
git hash-object hii.txt
```

Git should return the same hash.

Example:

```text
e965047ad7c57865823c7d992b1d046ea66edf78
```

If both hashes match, our implementation is correct.

---

# Step 6: How Git Stores the Object

Git does not place the entire hash in a filename.

Hash:

```text
e965047ad7c57865823c7d992b1d046ea66edf78
```

Git splits it:

```text
e9 | 65047ad7c57865823c7d992b1d046ea66edf78
```

Storage path:

```text
.git/objects/e9/65047ad7c57865823c7d992b1d046ea66edf78
```

Rule:

```text
First 2 characters  -> Folder name
Remaining characters -> File name
```

This prevents thousands of files from being stored in a single directory.

---

# Step 7: Compress the Object

Before writing to disk, Git compresses the object using zlib.

Node.js:

```js
import zlib from 'node:zlib'

const compressed =
    zlib.deflateSync(newData)
```

Git stores the compressed data, not the raw data.

---

# Step 8: Write the Object

Object directory:

```js
const dir =
    `.git/objects/${hash.slice(0, 2)}`
```

Object file:

```js
const file =
    `${dir}/${hash.slice(2)}`
```

Result:

```text
.git/objects/e9/65047ad7c57865823c7d992b1d046ea66edf78
```

The compressed object is written to this location.

---

# Complete Node.js Example

```js
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { readFileSync } from 'node:fs'

const fileData = readFileSync('hii.txt')

const header =
    Buffer.from(`blob ${fileData.length}\0`)

const object =
    Buffer.concat([header, fileData])

const hash = crypto
    .createHash('sha1')
    .update(object)
    .digest('hex')

const compressed =
    zlib.deflateSync(object)

console.log('Hash:', hash)

console.log(
    '.git/objects/' +
    hash.slice(0, 2) +
    '/' +
    hash.slice(2)
)
```

---

# Visual Flow

```text
hii.txt
   │
   ▼
Read File
   │
   ▼
Create Header
(blob <size>\0)
   │
   ▼
Combine Header + Content
   │
   ▼
SHA-1 Hash
   │
   ▼
Split Hash
(first 2 chars + remaining chars)
   │
   ▼
Compress Using zlib
   │
   ▼
Store Inside
.git/objects/
```

---

# Core Concept

Git does not hash:

```text
Hello World
```

Git hashes:

```text
blob 11\0Hello World
```

Formula:

```text
SHA1(
    "blob <size>\0<content>"
)
```

The resulting SHA-1 hash becomes the unique identifier for the Git object and determines where it is stored inside `.git/objects`.
