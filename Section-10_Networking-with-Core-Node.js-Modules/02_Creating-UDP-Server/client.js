import dgram from 'node:dgram'; //UDP

const socket = dgram.createSocket('udp4');

socket.on('message', (msg, remoteAddress) => {
  console.log(msg.toString()) 
  console.log(remoteAddress)
  socket.close()  
})

socket.send('Hii from Client.js', 4000, '192.168.31.13', () => {
  console.log("Message Sent")
})

// Client for mobile's server:
// This is client for mobile's UDP server 
socket.send('Hello From Laptop For Mobile...', 4000, '192.168.31.217', () => {
  console.log("Message Sent")
})