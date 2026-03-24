import fs from 'fs';

// const fd = fs.openSync('app.js')

const fd = fs.openSync('text.txt');
const readBuffer = Buffer.alloc(10);
fs.read(
  fd,
  {
    buffer: readBuffer,
    length:5,
    position: 2,
    offset:2,
    
  },
  (err, bytesRead, buffData) => {
    console.log(bytesRead);
    console.log(buffData.buffer);
    console.log(buffData.toString());
  },
);
