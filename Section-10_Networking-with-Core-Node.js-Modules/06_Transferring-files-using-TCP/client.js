import { createReadStream, createWriteStream } from 'node:fs';
import net from 'node:net';

// create client
const socket = net.createConnection({ host: '192.168.31.13', port: 4000 });

// get download file from server

// const writeStream = createWriteStream('C:\\Users\\T14\\Desktop\\Class.mp4');
// socket.pipe(writeStream);

// Handle error , if server lost
socket.on('error', () => {
  console.log('server Lost...');
});

/* // Upload a file to the server
const readStream = createReadStream('C:\\Users\\T14\\Desktop\\Zoom.mp4');
readStream.pipe(socket);
readStream.on('end', () => {
  console.log('file ended..')
}); */

// Send input to server
process.stdin.on('data', (input) => {
  const inputStr = input.toString().trim();
  if (inputStr === 'send') {
    const readStream = createReadStream('C:\\Users\\T14\\Desktop\\Zoom.mp4');
    readStream.pipe(socket);
    readStream.on('end', () => {
      console.log('file ended..');
    });
  }
});
