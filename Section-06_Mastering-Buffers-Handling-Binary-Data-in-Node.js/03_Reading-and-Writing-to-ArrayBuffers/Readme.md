## What is an `ArrayBuffer`?

* An `ArrayBuffer` is a **fixed-length binary buffer** that holds raw binary data.
* It **does not provide methods** to read/write data directly.
* Instead, you use views like:

  * `TypedArray` (e.g., `Uint8Array`, `Int16Array`, `Float64Array`)
  * `DataView` (for flexible reading/writing of multiple types, with control over byte offsets and endianness).

---

## Creating and Using an `ArrayBuffer`

```js
const buffer = new ArrayBuffer(4); // creates a 4-byte buffer
const view = new DataView(buffer);
```

* `DataView` allows you to read/write various numeric types at specific byte offsets.

---

## Writing Values to the Buffer

Example: Writing the number `80` using different notations into separate bytes:

```js
view.setInt8(0, 80);         // Decimal
view.setInt8(1, 0b1010000);  // Binary
view.setInt8(2, 0x50);       // Hexadecimal
view.setInt8(3, 0o120);      // Octal
```

* Each call writes to a **different byte** (0, 1, 2, 3).
* The number stored is always `80` in decimal, just expressed differently.

---

## Reading Values from the Buffer

```js
const value = view.getInt8(1);
console.log(value); // 80
```

* Reads a signed 8-bit integer from the specified byte offset.

---

## Handling Negative Numbers

```js
view.setInt8(0, -1);
console.log(view.getInt8(0));   // -1 (signed)
console.log(view.getUint8(0));  // 255 (unsigned)
```

* `getInt8` interprets the byte as signed (two's complement).
* `getUint8` interprets it as unsigned (0 to 255).

---

## What Happens When You Write Out-of-Range Values?

When storing a number larger than what the data type supports, JavaScript **wraps** or **truncates** the value to fit the available bits.

### Example: `setInt8(0, 300)`

1. Convert `300` to binary (decimal → binary):

   ```
   300 = 100101100 (9 bits)
   ```
2. Only the **last 8 bits** are stored:

   ```
   100101100 → 00101100
   ```
3. Interpretation:

   * As unsigned (`Uint8`): `0b00101100` = 44
   * As signed (`Int8`): MSB is 0, so also 44

```js
view.setInt8(0, 300);
console.log(view.getInt8(0));   // 44
console.log(view.getUint8(0));  // 44
```

* Hex representation of stored value: `0x2C`

⚠️ Overflow simply drops higher bits — **no warning** is issued.

---

## Simulating Large Memory Usage with `ArrayBuffer`

You can allocate large buffers and write to every byte to **force memory commitment** (physical RAM allocation) rather than just reserving virtual memory.

### Example:

```js
const a = new ArrayBuffer(1.99 * 1024 * 1024 * 1024); // ~1.99GB
const b = new ArrayBuffer(1.99 * 1024 * 1024 * 1024);
const c = new ArrayBuffer(1.99 * 1024 * 1024 * 1024);

const view1 = new DataView(a);
const view2 = new DataView(b);
const view3 = new DataView(c);

for (let i = 0; i < view1.byteLength; i++) {
  view1.setInt8(i, i + 1);
  view2.setInt8(i, i + 1);
  view3.setInt8(i, i + 1);
}

setInterval(() => console.log('App running...'), 1000); // keep process alive
```

* Each buffer is ~1.99 GB, total ~6 GB allocated.
* Writing every byte **commits the memory** to RAM.
* `setInterval` prevents buffers from being garbage collected by keeping the process alive.

---

### Important Notes on Large Memory Usage

* This uses a lot of RAM and may cause:

  * System slowdown
  * Browser or process crashes (due to memory limits)
* Node.js has default memory limits (~4 GB per process). Use:

```bash
node --max-old-space-size=8192 yourfile.js
```

to increase the limit (in MB).

---


## Summary

| Topic                      | Key Points                                                                   |
| -------------------------- | ---------------------------------------------------------------------------- |
| `ArrayBuffer` basics       | Fixed-length buffer, use `DataView` or `TypedArray` to access data           |
| Writing/Reading values     | Supports multiple numeric types, handles signed/unsigned                     |
| Overflow behavior          | Larger numbers truncated to fit bits, no warnings                            |
| Negative numbers           | Stored in two's complement, unsigned views interpret bits differently        |
| Large memory simulation    | Allocate large buffers, write all bytes to commit memory                     |
| Performance considerations | Large allocations may crash app/system, use Node.js flags to increase memory |

---