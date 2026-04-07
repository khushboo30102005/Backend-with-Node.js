import { open } from 'node:fs/promises';
import net from 'node:net';

const server = net.createServer(async (socket) => {
  const fileHandle = await open('C:\\Users\\T14\\Desktop\\numbers.txt');
  const { size } = await fileHandle.stat();
  const readStream = fileHandle.createReadStream({ highWaterMark: 32  });

  socket.write('HTTP/1.1 200 OK\n');

  socket.write('Access-Control-Allow-Origin: *\n');

  socket.write('Content-Type: text/json; charset= utf-8\n\n');

  // socket.write(`Content-Length: ${size}\n`);

  readStream.on('data', (chunk) => {
    socket.write(chunk);
    readStream.pause()
    setTimeout(() => {
      readStream.resume()
    }, 50);
  });

  // setTimeout(() => {
  //   socket.end(`{"name": "Khushboo"}`);
  // }, 4000);

  socket.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  // readStream.pipe(socket);

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
