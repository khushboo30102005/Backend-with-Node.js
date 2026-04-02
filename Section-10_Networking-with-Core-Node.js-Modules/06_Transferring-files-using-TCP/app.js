import { createReadStream, createWriteStream } from 'node:fs';
import net from 'node:net';

const clientList = [];
const clientUserName = [];

const server = net.createServer((socket) => {
  clientList.push(socket);

  clientUserName.push(`Client-${clientList.length - 1 + 1}`);

  console.log(`Total Client Connected: ${clientList.length}`);

  
  // Uploaded file from Client
  
  const writeStream = createWriteStream('Class.mp4')
  socket.pipe(writeStream)


/*   // Send file to the client
  const readStream = createReadStream('Class.mp4')
  readStream.pipe(socket)
  readStream.on('end', () => {
    console.log('File Ended')
  }) */


  // Trigger when client disconnected
  socket.on('close', () => {
    console.log(socket.remoteAddress, ': Client disconnected...');
  });

  // Handle Error
  socket.on('error', () => {
    console.log('Client Lost...');
  });

  console.log(socket.remoteAddress, ': Client connected');
});

// start to listening on server

server.listen(4000, '0.0.0.0', () => {
  const address = server.address();
  console.log('Server is started on port: ' + address.port);
});
