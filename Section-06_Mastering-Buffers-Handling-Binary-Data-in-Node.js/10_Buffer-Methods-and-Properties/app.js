import { Buffer } from 'buffer';
import fs from 'fs/promises';

const nodeBuffer = Buffer.from('hello world');
console.log(nodeBuffer)
// console.log(nodeBuffer.toString('hex'))
// fs.writeFile('file.txt', nodeBuffer)

const nodeBuffer2 = Buffer.alloc(8);
// nodeBuffer2.write("Hello!!!")
// nodeBuffer2[0] = 97
// nodeBuffer2[7] = 102
console.log(nodeBuffer2)

/*    METHODS   */
// console.log(nodeBuffer2.slice(0, 5))  // deprecated
// console.log(nodeBuffer2.subarray(0,6).toString())
// console.log(JSON.stringify(nodeBuffer2.toJSON()))
// nodeBuffer.copy(nodeBuffer2, 2, 0, 5)   // <Buffer 00 00 68 65 6c 6c 6f 00>
// //copySource.copy(pasteSource/target, startIndexForPaste, statIndexForCopy, endIndexForCopy)
// console.log(nodeBuffer2)
// console.log(nodeBuffer.includes("hello"))
// console.log(nodeBuffer.includes("hello", 5, 'utf-16le'))
// nodeBuffer2.fill('khushboo')
// console.log(nodeBuffer2.readInt8(5))   // give dec code
// nodeBuffer2.writeInt8(0x76)
// nodeBuffer2.writeInt8(0x77, 1)
// nodeBuffer2.writeInt16LE(0x76, 1)
// nodeBuffer2.writeInt16LE(0x77, 4)
// nodeBuffer2.writeInt16BE(0x76, 1)
// nodeBuffer2.writeInt16BE(0x77, 4)
// console.log(nodeBuffer2)
// console.log(nodeBuffer2.at(5))  // Ascii code at this index

/*    PROPERTIES   */
// console.log(nodeBuffer.buffer)  // give underlying arrayBuffer
// console.log(nodeBuffer.BYTES_PER_ELEMENT);
// console.log(nodeBuffer.byteLength);
// console.log(nodeBuffer.byteOffset);
// console.log(nodeBuffer.length);

// console.log(nodeBuffer2)
// console.log(nodeBuffer2.toString())
// console.log(nodeBuffer2.toString('utf-8'));

// const Decoder = new TextDecoder('utf-8')
// console.log(Decoder.decode(nodeBuffer2))

// fs.writeFile('file.txt', nodeBuffer2)
