import { Buffer } from 'buffer';
/* const nodeBuffer = new Buffer.alloc(4);
console.log(nodeBuffer); */

// const nodeBuffer = Buffer.alloc(4)
// console.log(nodeBuffer)

/* const a = new ArrayBuffer(4)
const uint8Array = new Uint8Array(a)
uint8Array[0] = 97
uint8Array[1] = 98
uint8Array[2] = 99
uint8Array[3] = 100
console.log(uint8Array)
const nodeBuffer = Buffer.from(a) */
// const nodeBuffer = Buffer.from([97, 98, 99, 100])
// console.log(nodeBuffer)
// // console.log(uint8Array.toString())
// console.log(nodeBuffer.toString())


const nodeBuffer1 = Buffer.alloc(4)
const nodeBuffer2 = Buffer.from([97, 98, 99, 100])
const nodeBuffer3 = Buffer.allocUnsafe(4)

console.log(nodeBuffer1)
console.log(nodeBuffer1.buffer)
console.log(nodeBuffer1.buffer.byteLength)
console.log(nodeBuffer2.buffer.byteLength)
console.log(nodeBuffer3.buffer.byteLength)

console.log('end')
