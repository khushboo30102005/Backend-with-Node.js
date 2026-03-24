//TIME : 1:10.891 (m:ss.mmm) , for write one lakhs number using writeFileSync
//TIME : 550ms , for write one lakhs number using streams


import fs from 'fs';

console.time();
const buff = Buffer.allocUnsafe(16*1024);

let totalByteWrittenInBuffer = 0;
let remainingStr = '';

const fd = fs.openSync('numbers.txt', 'w');

for (let i = 1; i <= 100000; i++) {
  let str = `${i}, `;
  str = remainingStr + str;
  const byteWritten = buff.write(str, totalByteWrittenInBuffer);
  remainingStr = '';
  const writtenByteDiff = str.length - byteWritten;
  if (writtenByteDiff !== 0) {
    remainingStr += str.slice(byteWritten);
  }

  totalByteWrittenInBuffer += byteWritten;

  if (totalByteWrittenInBuffer === buff.byteLength) {
    fs.writeSync(fd, buff);
    totalByteWrittenInBuffer = 0;
  }
}

fs.writeSync(fd, buff.subarray(0, totalByteWrittenInBuffer) + remainingStr);

// fs.closeSync(fd)
console.timeEnd();

// NOW TIME : 40ms , Using custom internal buffer