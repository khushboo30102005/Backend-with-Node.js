import net from 'node:net';

// create server instance
// We can passes here socket that getting over connection event
// This callback runs on every new client connection
const server = net.createServer((socket) => {
  socket.on('data', (chunk) => {
    console.log(chunk.toString());
    socket.write('Got Your Message.');
    // socket.end();
  });

  socket.on('close', () => {
    console.log(socket.remoteAddress, ': Client disconnected...');
  });
  // Handle Error
  socket.on('error', () => {
    console.log('Client Lost...');
  });
  console.log(socket.remoteAddress, ': Client connected');
});

// start to listen on server

server.listen(4000, '0.0.0.0', () => {
  const address = server.address();
  console.log('Server is started on port: ' + address.port);
});
