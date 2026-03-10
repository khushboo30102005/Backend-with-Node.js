# Buffer in Node.js

In `Node.js`, `Buffer` is a global class used to handle binary data.

This is a TypedArray with extra Methods and Properties, provided by Nodejs. it create ArrayBuffer implicitly same as TypedArrays.

But This global function ` new Buffer(4)` is deprecated due to security and usability issues.

Right way to use it is direct import from buffer that is a nodejs core module.

```js
const uint8Array = new Uint8Array(4);
const NodeBuffer = new Buffer(4);
console.log(uint8Array.buffer);
console.log(NodeBuffer.buffer);
```

```bash
ArrayBuffer { [Uint8Contents]: <00 00 00 00>, byteLength: 4 }
ArrayBuffer { [Uint8Contents]: <00 00 00 00>, byteLength: 4 }
(node:8568) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
```

## How to create and use nodejs Buffer:

1. **Import form node:buffer** : Recommended way By Node.js

```js
import { Buffer } from 'node:buffer';
const nodeBuffer = Buffer.alloc(4);
console.log(nodeBuffer); // <Buffer 00 00 00 00>
```

Now using Buffer we get access of all methods of buffer like `alloc()`, `from()` etc.

2. **Install buffer as dev dependency:**

- **Installation** :
  ```bash
  npm i @types/node -D
  ```
- **Use**:
  ```js
  const nodeBuffer = new Buffer.alloc(4);
  console.log(nodeBuffer); // <Buffer 00 00 00 00>
  ```

#### Create nodejs Buffer using ArrayBuffer by from() method:

`alloc()` method create ArrayBuffer implicitly using byte size and store it in `buffer` property. But if we want to create this explicitly so we have to use `form()` method instead of `alloc()`.

```js
const a = new ArrayBuffer(4);
const nodeBuffer = Buffer.from(a);
```

### `toString()` method on typedArray and nodeBuffer:

```js
console.log(uint8Array.toString()); //97,98,99,100
console.log(nodeBuffer.toString()); //abcd
```

- In typedArrays toString() method provide ASCII code of stored data.
- In Nodejs buffer toString() method provide original decoded data.
