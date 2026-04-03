const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('{"Message":"Hello, Procodrr!"}');
});

server.listen(4000, () => {
  console.log('Http server is running on, http://localhost:4000');
  console.log(server.address())  // ByDefault: { address: '::', family: 'IPv6', port: 4000 }
});
