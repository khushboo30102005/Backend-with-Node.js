import dgram from 'node:dgram'; //UDP

const socket = dgram.createSocket('udp4');

// console.log(socket)


// socket.on('listening', () => {
//   console.log(socket.address())
//   console.log(`Listening on Port:${socket.address().port}`)
// })

/* socket.bind(4000, () => {
  console.log(`Listening on Port: ${socket.address().port}`);
});
 */


socket.on('message', (massage, remoteAddress) => {
  console.log(massage.toString())  //msg sent by client
  console.log(remoteAddress)     // client device information
  socket.send('Message Received SuccessFully on Server', remoteAddress.port, `${remoteAddress.address}`)
})
socket.bind({ port: 4000 }, () => {
  const address = socket.address();
  console.log(`Listening on Port: ${address.port}`);
});
