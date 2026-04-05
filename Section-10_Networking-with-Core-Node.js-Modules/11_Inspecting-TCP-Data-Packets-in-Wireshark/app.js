import { open } from 'node:fs/promises';
import net from 'node:net';

const server = net.createServer(async (socket) => {

  const fileHandle = await open('C:\\Users\\T14\\Desktop\\numbers.txt');
  const { size } = await fileHandle.stat();
  const readStream = fileHandle.createReadStream({highWaterMark: 32 * 1024});

  socket.write('HTTP/1.1 200 OK\r\n');

  socket.write('Access-Control-Allow-Origin: *\r\n');

  socket.write('Content-Type: text/txt; charset= utf-8\n');

  socket.write(`Content-Length: ${size}\n`);


  socket.write('\r\n\r\n');

  socket.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  readStream.pipe(socket);

  readStream.on('end', () => {
    console.log('File ended');
  });

  socket.on('close', () => {
    console.log(socket.remoteAddress, ': Client disconnected');
  });

  socket.on('error', () => {
    console.log('Client Lost');
  });
  console.log('Client Connected', socket.remoteAddress);
});

server.listen(4000, '0.0.0.0', () => {
  console.log('Server started on port 4000');
});
