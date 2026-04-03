import net from 'node:net'

// create client
const socket = net.createConnection({host: '192.168.31.13', port: 4000})


// Read massage form server

socket.on('data', (chunk) => {
  console.log(chunk.toString())
})


// Handle error , if server lost
socket.on('error', () => {
  console.log('server Lost...')
})

// Send input to server
process.stdin.on('data', (input) =>{
  socket.write(input)
})