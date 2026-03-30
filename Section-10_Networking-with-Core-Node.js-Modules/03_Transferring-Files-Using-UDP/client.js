import dgram from 'node:dgram';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';

const socket = dgram.createSocket('udp4');

socket.on('message', (msg, rinfo) => {
  console.log(msg.toString());
  console.log(rinfo);
  socket.close();
});

// Small size File transfer using readFile
/* const numData = await readFile("C:\\Users\\T14\\Desktop\\num.txt")  // read small file 
// console.log(numData)

socket.send(numData, 4000, 'ip', () => {
   console.log('Message sent..')
})  */

// // Send Large file:

// const readStream = createReadStream('C:\\Users\\T14\\Desktop\\numbers.txt', {
//   highWaterMark: 1000,
// });
// const fileSize = (await stat('C:\\Users\\T14\\Desktop\\numbers.txt')).size

const readStream = createReadStream('C:\\Users\\T14\\Desktop\\Zoom.mp4', {
  highWaterMark: 1000,
});
const fileSize = (await stat('C:\\Users\\T14\\Desktop\\Zoom.mp4')).size
console.log(fileSize)
let chunkRead = 0
readStream.on('data', (chunk) => {
  socket.send(chunk, 4000,'ipAdd', () => {
    // chunkRead += chunk.byteLength
    // console.log(Math.floor((chunkRead/fileSize)*100)+ '%');
  });
});

readStream.on('end', () => {
  socket.send('EOF',4000,'ipAdd', () => {
    console.log("EOF message Sent")
  } )
})