## Buffer.alloc() vs Buffer.allocUnsafe()

In Node.js, we have two methods to create Buffer memory:

- `Buffer.alloc(size)`
- `Buffer.allocUnsafe(size)`

Both allocate memory of the given size, but their behavior is different.

---

### 1️⃣ Buffer.alloc(size)

- Allocates a new Buffer of the specified size.
- **Memory is initialized with zeros (0x00).**
- Safer to use because it does not contain old data.
- Slightly slower due to memory initialization.

```js
const buffer1 = Buffer.alloc(4);
console.log(buffer1); 
// <Buffer 00 00 00 00>
```

✅ Use this when security and predictable content matter.

---

### 2️⃣ Buffer.allocUnsafe(size)

- Allocates a new Buffer of the specified size.
- **Memory is NOT initialized.**
- May contain old/garbage data from memory.
- Faster because it skips initialization.

```js
const buffer2 = Buffer.allocUnsafe(4);
console.log(buffer2);
// <Buffer ?? ?? ?? ??> (random data)
```

⚠️ Use carefully. Always overwrite the buffer before reading from it.

Example of safe usage:

```js
const buffer3 = Buffer.allocUnsafe(4);
buffer3.fill(0);
console.log(buffer3);
// <Buffer 00 00 00 00>
```

---

### 🔎 Key Differences

| Feature              | Buffer.alloc() | Buffer.allocUnsafe() |
|----------------------|-----------------|----------------------|
| Memory Initialized   | Yes (0-filled)  | No                   |
| Security             | Safe            | Risky if not handled |
| Performance          | Slightly slower | Faster               |
| Contains Old Data    | No              | Possible             |

---

### 🧠 Core Concept

- `Buffer.alloc()`-> **Safe but slower**
- `Buffer.allocUnsafe()`-> **Fast but must be handled carefully**