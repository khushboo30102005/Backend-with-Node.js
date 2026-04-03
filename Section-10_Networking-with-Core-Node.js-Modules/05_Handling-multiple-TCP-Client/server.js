import net from 'node:net';

const clientList = [];
const clientUserName = []

const server = net.createServer((socket) => {

  clientList.push(socket);
  clientUserName.push(`Client-${clientList.length - 1 + 1}`)

  socket.write(`Your UserName: ${clientUserName[clientUserName.length-1]}`);

  console.log(`Total Client Connected: ${clientList.length}`);
  
  socket.on('data', (chunk) => {
    console.log(chunk.toString());
    // clientList.forEach((socket) => {
    //   socket.write(chunk);
    // });
  });

  process.stdin.on('data', (input) => {
    const inputStr = input.toString();
    let [userId] = inputStr.split(' ');
    if (clientList.indexOf(socket) + 1 == userId) {
      socket.write(input.slice(2));
    }
  });
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
