import net from 'node:net'

// create client
const socket = net.createConnection({host: '192.168.31.13', port: 4000})

// Send msg on server
setTimeout(() => {
  socket.write('Hello from Client.js')
  socket.end()
},2000)

// Read massage form server

socket.on('data', (chunk) => {
  console.log(chunk.toString())
})

socket.on('error', () => {
  console.log('server Lost...')
})