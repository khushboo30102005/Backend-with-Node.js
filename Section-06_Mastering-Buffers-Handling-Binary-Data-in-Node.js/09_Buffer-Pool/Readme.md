# Buffer Pool in nodejs:

`Buffer pool` is an internal pool of raw memory (RAM) used by Node.js for creating small buffers using Buffer.allocUnsafe().

## `poolSize`: 8KB

`Buffer.poolSize` = 8192 bytes (8KB) by default.

Only small buffers (< ~4KB) use this pool.

Large Buffers allocate separate memory.

This memory was may common for many nodejs Buffers that created through `allocUnsafe()` method.

Means They may use same underlying ArrayBuffer with different Offset.

```js
const b = Buffer.allocUnsafe(8);
const c = Buffer.allocUnsafe(4);
console.log(b.buffer === c.buffer); // true
```

### Conditions for allocUnsafe to use Buffer pool:

```
bufferSize < (Buffer.poolSize >>>> 1)
```

(Bitwise right shift : x >>> 1 === Math.floor(x / 2))

```js
size < 4096 bytes
```

If `true`, Then it uses the pool.

Otherwise → separate allocation.

#### What happens when full memory size exhausted :

If the current internal pool buffer has no remaining free space:  
In this situation NodeJs creates a new Buffer Pool.

#### Update Buffer.poolSize :

```js
Buffer.poolSize = 10000;
```

This Updated poolSize applies from second buffer pool, When The first pool gets exhausted.  
First Buffer pool always have byDefault Pool size (8192 Bytes)

##### Why first pool is still 8192 bytes?

- When Node.js starts:
  - The first internal Buffer pool is created automatically

  - It uses the default size = 8192 bytes

### Buffer.from() :

- `Buffer.from()` method also use BufferPool , means it use `Buffer.allocUnsafe()` internally.  
  For small sizes → pool  
  For large sizes → separate memory

### Buffer.concat() :

```js
const a = Buffer.alloc(4);
const z = Buffer.alloc(4);
const joinBuffer = Buffer.concat([a, z]);
```

Here JoinBuffer creates new Buffer and use BufferPool.

Buffer.concat() internally uses:

```js
Buffer.allocUnsafe(totalLength);
```

### buffer.constants in Node.js

When we run:

```js
import { constants } from 'node:buffer';
```

We get something like:

```js
{
  MAX_LENGTH: 9007199254740991,
  MAX_STRING_LENGTH: 536870888
}
```

1️⃣ MAX_LENGTH

```js
MAX_LENGTH: 9007199254740991;
```

Meaning:

This is the maximum allowed size (in bytes) for a Buffer.

Value is equal to:

```
Number.MAX_SAFE_INTEGER
// 2^53 - 1
```

Explanation:

JavaScript numbers are safe up to 2^53 - 1.

So Node.js sets this as the upper limit for Buffer size.

**⚠️ Practically, you cannot allocate this much memory because of RAM limits — but this is the theoretical maximum boundary.**

🔹 2️⃣ MAX_STRING_LENGTH

```js
MAX_STRING_LENGTH: 536870888;
```

Meaning:

This is the maximum length of a JavaScript string in Node.js.

It mainly affects:

```js
buffer.toString();
```

### allocUnsafeSlow()

```js
const E = Buffer.allocUnsafe(4);
const F = Buffer.allocUnsafeSlow(4);

console.log(E.byteLength);  // 8192
console.log(F.byteLength);  // 4
```

same as allocUnsafe() But it does not use Buffer Pool
