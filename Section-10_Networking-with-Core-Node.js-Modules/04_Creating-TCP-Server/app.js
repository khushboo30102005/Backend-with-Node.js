import net from 'node:net';

// create server instance
const server = net.createServer();

// start to listen on server

server.listen(4000,'0.0.0.0', () => {
  const address = server.address();
  console.log('Server is started on port: ' + address.port);
});


// When a server started listening event is fired on this sever:
// Also write it in server.listen as cb function
// server.on('listening', () => {
//   const address = server.address()
//   console.log("Server is started on port: " + address.port)
// })


// When a client connects to the server, Connection event is trigged

// In cb function we have to access of socket that is a duplex stream.

server.on('connection', (socket) => {
  socket.on('data', (chunk) => {
    console.log(chunk.toString()) 

    socket.write('HTTP\n\nGot Your Message.')
    socket.end()
  })
  console.log(socket.address())  // address of server machine

  console.log(socket.remoteAddress)  //  remote IP address

  console.log(socket.remoteFamily)  // remote IP family

  console.log(socket.remotePort)   // remote port


  // close event is triggered on socket when connection is disconnected

  socket.on('close', () => {
    console.log(socket.remoteAddress, ": Client disconnected...")
  })
  console.log(socket.remoteAddress, ': Client connected')
})

