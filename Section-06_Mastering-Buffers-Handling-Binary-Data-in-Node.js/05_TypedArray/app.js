// const a = new ArrayBuffer(4)
// console.log(a)

// const uint8Array = new Uint8Array(a)
// const uint16Array = new Uint16Array(a)
// const uint32Array = new Uint32Array(a)
// const uint64Array = new BigUint64Array(a)

// Write in typedArray
// uint8Array[0] = 0x3a
// console.log("first")
/* uint32Array[0] = 0x23ae23af
uint16Array[0] = 0x23ae

console.log(uint8Array[0])
console.log(uint8Array)

console.log(uint16Array[0])
console.log(uint16Array)
console.log(uint32Array)
// console.log(uint64Array)
 */

//play with typedArrays using Uint8array:

/* const a = new ArrayBuffer(3)
const uint8Array = new Uint8Array(a)
console.log(uint8Array.buffer)  // stores exact arrayBuffer that provided by us during creation of this array
console.log(uint8Array.buffer === a)  // true */
/* 
// Create ArrayBuffer Implicitly:
const uint8Array = new Uint8Array(4)
console.log(uint8Array.buffer) */

// fill also:
// const uint8Array = new Uint8Array([0x1e, 0x65, 0xea, 0xa9])
// console.log(uint8Array)
// console.log(uint8Array.buffer)

/* // How to write data in fill method :
const uint8Array = new Uint8Array(1.9 * 1024 * 1024 * 1024).fill(0xff)
console.log(uint8Array)
console.log(uint8Array.buffer) */

/* 
const a = new ArrayBuffer(4);
console.log(a.byteLength)
console.log(a.maxByteLength)
console.log(a.resizable)
// a.resize(8)  // error:  TypeError: Method ArrayBuffer.prototype.resize called on incompatible receiver #<ArrayBuffer>

const b = new ArrayBuffer(4, {maxByteLength:16});
console.log(b)
console.log(b.byteLength)
console.log(b.maxByteLength)
console.log(b.resizable)
b.resize(8)  // resized successfully
console.log(b) */


/* const a = new ArrayBuffer(8, {maxByteLength:12});
const uint8Array = new Uint8Array(a);
uint8Array[0] = 0x3a;
uint8Array[2] = 0xa4;
uint8Array[4] = 0x55;
uint8Array[6] = 0xdd;
console.log(a)
const b = a.transfer(4);
console.log(a)
console.log(b) */


