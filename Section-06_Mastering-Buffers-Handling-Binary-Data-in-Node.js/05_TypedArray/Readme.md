# **_TypedArrays_**:

TypedArray is not normal JS arrays but specialized array-like objects. it is category of different types of `ArrayConstructors`.

- These Arrays store signed integer within specific range (like 8-bit, 16-bit, 32-bit, 64-bit)
  - `Int32Array`
  - `Int8Array`
  - `Int16Array`
  - `BigInt64Array`

- These Arrays are store only Unsigned integers (zero and positive) within given range.
  - `Uint8Array`
  - `Uint8ClampedArray`
  - `Uint16Array`
  - `Uint32Array`
  - `BigUint64Array`

- These Arrays are store Floating number of 32-bit and 64-bit
  - `Float32Array`
  - `Float64Array`

### why they are TypedArrays :

The name of the category of all of these Arrays because they have special type to store values, means they only store numbers.

### main Points:

- TypedArrays use the platform's native endianness (usually little-endian).
- ### Create a Typed Array:
  - First create an ArrayBuffer

  ```js
  const a = new ArrayBuffer(4);
  ```

  this is a 4-byte ArrayBuffer, Means it is conserve 4 byte of memory in RAM. and we access this using variable `a` in this case.
  - Then create a typed Array using its different type of arrayConstructors.

```js
const uint8Array = new Uint8Array(a); // every element of this array has 1 byte of storage capacity ->  [ 0, 0, 0, 0 ]

const uint16Array = new Uint16Array(a); // Every element of this array has 2 byte  --> [ 0, 0 ]
const uint32Array = new Uint32Array(a); // Every element of this array has 4 byte  --> [ 0 ]
```

- ### How to write in this array :
  - Just like simple array

  ```js
  uint8Array[0] = 0x3a; // [ 58, 0, 0, 0 ]
  uint16Array[0] = 0x23ae; // Uint16Array(2) [ 9134, 0 ]
  uint32Array[0] = 0x23ae23af; //  Uint32Array(1) [ 598614959 ]
  ```

  - How one byte store in different byte size typed array -->

  ```js
  uint8Array[0] = 0x3a;
  Uint8Array(4)[(58, 0, 0, 0)];
  Uint16Array(2)[(58, 0)];
  Uint32Array(1)[58];
  ```

  - How Two byte store in different byte size typed array -->

  ```js
  Uint16Array[0] = 0x23ae; //in dec 9134
  Uint8Array(4)[(174, 35, 0, 0)]; // it represent that typed Arrays are write data in Little Endian  [ in dec 23 --> 35 , ae --> 174 ]
  Uint16Array(2)[(9134, 0)];
  Uint32Array(1)[9134];
  ```

  - How Four byte store in different byte size typed array -->

  ```js
  uint32Array[0] = 0x23ae23af; //in dec 598614959
  Uint8Array(4)[(175, 35, 174, 35)]; // LSB stores first
  Uint16Array(2)[(9135, 9134)];
  Uint32Array(1)[598614959];
  ```

- ### How to read data form typedArray:
  - syntax : Just like Normal Array

```js
console.log(uint8Array[0]);
```

```js
uint16Array[0] = 0x23ae;

console.log(uint8Array); // Uint8Array(4) [ 174, 35, 0, 0 ]
console.log(uint8Array[0]); // 174

console.log(uint16Array); // Uint16Array(2) [ 9134, 0 ]
console.log(uint16Array[0]); // 9134
```

## Deep dive in typedArray using `Uint8Array` :

```js
const a = new ArrayBuffer(3);
const uint8Array = new Uint8Array(a);
console.log(uint8Array.buffer); // stores exact arrayBuffer that provided by us during creation of this array
console.log(uint8Array.buffer === a); // true
```

- `buffer` property of this array stores the arrayBuffer that attach with it.
- Using this property we can create arrayBuffer without using ArrayBUffer constructor function Explicitly. This ArrayBuffer is not accessible globally, it only accessible with its typedArray's buffer property.

```js
const uint8Array = new Uint8Array(4);
console.log(uint8Array.buffer);
//output : ArrayBuffer { [Uint8Contents]: <00 00 00 00>, byteLength: 4 }
```

#### Another Way to create an ArrayBuffer and write data using TypedArray

```js
const uint8Array = new Uint8Array([0x1e, 0x65, 0xea, 0xa9]);
console.log(uint8Array); // Uint8Array(4) [ 30, 101, 234, 169 ]
console.log(uint8Array.buffer); // ArrayBuffer { [Uint8Contents]: <1e 65 ea a9>, byteLength: 4 }
```

#### Fill Method typed Array:

Used to write whole data in one line :

```js
const uint8Array = new Uint8Array(1.9 * 1024 * 1024 * 1024).fill(0xff);
console.log(uint8Array);
console.log(uint8Array.buffer);

outPut:
Uint8Array(2040109465) [
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  ... 2040109365 more items
]
ArrayBuffer {
  [Uint8Contents]: <ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff  ... 2040109365 more bytes>,
  byteLength: 2040109465
}
```

## MaxByteLength and resizable :

```js
const a = new ArrayBuffer(4);
```

byteLength of This ArrayBuffer: 4

maxByteLength: 4 (same as byteLength byDefault)

resizable: false (false byDefault , We can't resize this ArrayBuffer)

- #### How to make it `resizable: true`

  It can't it set directly instead of that we have to give maxByteLength during ArrayBuffer object creation.
  - Before

  ```js
  const a = new ArrayBuffer(4);
  console.log(a.byteLength);
  console.log(a.maxByteLength);
  console.log(a.resizable);
  // a.resize(8)  // error:  TypeError: Method ArrayBuffer.prototype.resize called on incompatible receiver #<ArrayBuffer>
  ```

  - after:

  ```js
  const b = new ArrayBuffer(4, { maxByteLength: 16 });
  console.log(b); // ArrayBuffer { [Uint8Contents]: <00 00 00 00>, byteLength: 4 }
  console.log(b.byteLength);
  console.log(b.maxByteLength);
  console.log(b.resizable);
  b.resize(8); // resized successfully
  console.log(b); // ArrayBuffer {[Uint8Contents]: <00 00 00 00 00 00 00 00>,  byteLength: 8}
  ```

## detached and transfer:

transfer() is a new proposal feature (Resizable ArrayBuffer feature).

```js
const a = new ArrayBuffer(4);
console.log(a.detached); // false
```

- resizable: false
- How it become true:
  Detach it from a to attach to b (new variable name) using transfer method.

  ```js
  const b = a.transfer(4);
  console.log(a.detached); // true
  ```

  ```js
  const a = new ArrayBuffer(8);
  const uint8Array = new Uint8Array(a);
  uint8Array[0] = 0x3a;
  uint8Array[2] = 0xa4;
  uint8Array[4] = 0x55;
  uint8Array[6] = 0xdd;
  console.log(a); // ArrayBuffer {[Uint8Contents]: <3a 00 a4 00 55 00 dd 00>,  byteLength: 8}
  const b = a.transfer(4);
  console.log(a); //ArrayBuffer { (detached), byteLength: 0 }
  console.log(b); // ArrayBuffer { [Uint8Contents]: <3a 00 a4 00>, byteLength: 4 }
  ```

## TypedArray Properties

Each typed array has:

```js
typedArray.byteLength;
typedArray.byteOffset;
typedArray.length;
typedArray.buffer;
```
