const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end('{"message": "Hello, ProCodrr!"}');
});

server.listen(4000, () => {
  console.log(server.address())
  console.log("HTTP server is running...");
});
