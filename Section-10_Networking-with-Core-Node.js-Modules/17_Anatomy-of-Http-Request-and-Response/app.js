import http from "node:http";

const server = http.createServer((request, response) => {
  console.log(request.method);
  request.on("data", (chunk) => {
    console.log("1");
    console.log(chunk.toString());
  });
  response.statusCode = 200;
  response.setHeader("Content-Length", "23");
  response.write("Hello from http server.");
});

server.on("connection", (socket) => {
  socket.on("data", (chunk) => {
    console.log("2");
    console.log(chunk.toString());
  });
});

server.listen(4000, "0.0.0.0", () => {
  console.log("Server started");
});
