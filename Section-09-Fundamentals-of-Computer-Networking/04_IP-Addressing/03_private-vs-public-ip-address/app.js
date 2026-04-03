import http from "http";

const server = http.createServer((req, res) => {
  res.end("Hello, World!");
});

server.listen(4000,'0.0.0.0', () => {
  console.log("Server is listening on localhost, port 4000");
});
