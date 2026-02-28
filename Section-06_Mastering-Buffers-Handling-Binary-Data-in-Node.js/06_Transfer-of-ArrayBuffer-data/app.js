import fs from 'fs/promises';

// Assignment : store proCodrr in ArrayBuffer (8-bit) and Print it :
// what i do :
/* 
const a = new ArrayBuffer(8);
const uint8Array = new Uint8Array(a);
console.log(a);
const data = 'ProCodrr';
for (let i = 0; i < a.byteLength; i++) {
  uint8Array[i] = data.charCodeAt(i);
  // console.log(data.charCodeAt(i).toString(16)) // this is the hex code that fill in arrayBuffer

}

// console.log(data.charCodeAt(0))
console.log(a);
let res = ''
for(let i = 0; i< a.byteLength; i++){
  res += String.fromCharCode(uint8Array[i])
}
console.log(res) */

// Right Approach:
// const uint8Array = new Uint8Array(8);
// uint8Array[0] = 0x50;
// uint8Array[1] = 0x72;
// uint8Array[2] = 0x6f;
// uint8Array[3] = 0x43;
// uint8Array[4] = 0x6f;
// uint8Array[5] = 0x64;
// uint8Array[6] = 0x72;
// uint8Array[7] = 0x72;
const encoder = new TextEncoder();
const uint8Array = encoder.encode("ProCodrr");
// decode data using TextDecoder
const decoder = new TextDecoder('utf-8');
console.log(decoder.decode(uint8Array));

const view = new DataView(uint8Array.buffer);
fs.writeFile('buffer-text.txt', view);
