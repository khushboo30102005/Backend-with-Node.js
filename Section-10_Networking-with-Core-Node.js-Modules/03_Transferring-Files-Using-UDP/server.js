import dgram from 'node:dgram';
import { createWriteStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';

const socket = dgram.createSocket('udp4');
/* 
// get Small File
socket.on('message', (msg, rinfo) => {
  writeFile('num.txt', msg) 
  console.log(rinfo)
  socket.send('Message Received successfully on server', rinfo.port, rinfo.address)
})

socket.bind({ port: 4000 }, () => {
  const address = socket.address();
  console.log(`Listening on port: ${address.port}`);
});
 */
// Get Large File

const writeStream = createWriteStream('Zoom.mp4')
socket.on('message', (msg, rinfo) => {
  if(msg.toString() === 'EOF'){
    socket.send('File Uploaded Successfully on Server.', rinfo.port,rinfo.address )
  }else{
    writeStream.write(msg)
  }
})

socket.bind({ port: 4000 }, () => {
  const address = socket.address();
  console.log(address)
  console.log(`Listening on port: ${address.port}`);
});
