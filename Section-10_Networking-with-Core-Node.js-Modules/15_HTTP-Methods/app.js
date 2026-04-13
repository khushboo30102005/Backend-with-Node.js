import http from "node:http";

const server = http.createServer((request, response) => {
  console.log(request.method);
  response.statusCode = 301;
  response.setHeader("Content-Length", "23");
  response.end("Hello from http server.");

});

server.listen(4000, "0.0.0.0", () => {
  console.log("Server started");
});
