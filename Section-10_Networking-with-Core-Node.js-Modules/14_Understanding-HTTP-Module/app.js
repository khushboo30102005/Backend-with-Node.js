import http from 'node:http';

// Request is readable stream 
// Response is writeable stream
const server = http.createServer((request, response) => {
  // response.writeHead(200, 'OK', {"content-length": 18})
   console.log(request.url)
   console.log(request.headers)
   console.log(request.method)

  console.log('Got the request')

  response.setHeader('Content-length', '18');
  response.setHeader('Access-Control-Allow-Origin', '*');

  response.write('Hii from server!!!');

  // response.end()
// get body as data only
  request.on('data', (chunk) => {
    console.log(chunk.toString())
  })
});

// server.on('connection', (Socket) => {
//   Socket.end('HTTP\n\nhii from server')
//   console.log('got the data')
//   Socket.on('data', (chunk) => {
//     console.log(chunk.toString())
//   })
// })

server.listen(4000, '0.0.0.0', () => {
  console.log('server started...');
});
