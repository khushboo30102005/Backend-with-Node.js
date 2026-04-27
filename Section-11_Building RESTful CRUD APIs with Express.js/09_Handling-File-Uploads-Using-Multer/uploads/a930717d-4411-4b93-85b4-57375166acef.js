const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('{"Message":"Hello, Procodrr!"}');
});

server.listen(3000, () => {
  console.log('Http server is running on, http://localhost:3000');
});
