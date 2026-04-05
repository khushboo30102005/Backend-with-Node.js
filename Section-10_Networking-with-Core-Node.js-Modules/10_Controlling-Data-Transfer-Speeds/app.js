import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';
import net from 'node:net';

const server = net.createServer(async (socket) => {
  const fileHandle = await open('C:\\Users\\T14\\Desktop\\Zoom.mp4');
  const { size } = await fileHandle.stat();
  const readStream = fileHandle.createReadStream();

  socket.write('HTTP/1.1 200 OK\r\n');

  socket.write(`Content-Length: ${size}\n`);

  socket.write('Content-Disposition: attachment; filename=story.mp4');

  socket.write('\r\n\r\n');

  socket.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  // Handle backPressure manually:

  /*   readStream.on('data', (chunk) => {
    socket.write(chunk)
    readStream.pause()
    setTimeout(() => {
      readStream.resume()
    }, 0)
  }) */

  readStream.pipe(socket);
  
  //  Browser pause and resume stream for handling backpressure.
  readStream.on('pause', () => {
    console.log('paused');
  });
  readStream.on('resume', () => {
    console.log('resumed');
  });

  /* 
  readStream.on('data', (chunk) => {
    if (!socket.write(chunk)) {
      readStream.pause();
    }
  });

  socket.on('drain', () => {
    readStream.resume()
  }) */

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
