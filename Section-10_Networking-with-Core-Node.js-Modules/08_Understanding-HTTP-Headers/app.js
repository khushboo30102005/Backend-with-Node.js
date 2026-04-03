import { createReadStream } from 'node:fs';
import net from 'node:net';

process.stdin.on('data', (input) => {
  const inputStr = input.toString();
  const [clientIndex] = inputStr.split(' ');
  console.log(clientIndex);
  if (typeof parseInt(clientIndex) === 'number') {
    clientsList[parseInt(clientIndex)].write(inputStr.substring(1));
  } else {
    clientsList.forEach((socket) => {
      socket.write(input);
    });
  }
});

const clientsList = [];

const server = net.createServer((socket) => {
  // socket.write(
  //   'HTTP/1.1 200 OK\nAccess-Control-Allow-Origin:*\nAccess-Control-Expose-Headers:*\nHello:World\n\n',
  // );
  
  socket.write('HTTP/1.1 200 OK\r\n');
  socket.write('Access-Control-Allow-Origin: *\r\n');
  // socket.write('Access-Control-Expose-Headers: *\r\n');
  socket.write('Access-Control-Expose-Headers: Name\r\n');
  socket.write('Hello: World\n');
  socket.write('name: khushboo');
  socket.write('\r\n\r\n');
  

  clientsList.push(socket);
  console.log(clientsList.length);

  socket.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  // const readStream = createReadStream("C:\\Users\\T14\\Desktop\\Zoom.mp4");
  const readStream = createReadStream('river.webp');
  // const readStream = createReadStream('num.txt');
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
