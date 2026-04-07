import { createWriteStream } from "node:fs";
import { open } from "node:fs/promises";
import net from "node:net";

const server = net.createServer(async (socket) => {
  socket.write("HTTP/1.1 200 OK\n\n");

  const writeStream = createWriteStream('numbers.txt')

  socket.on('data', (chunk) => {
    writeStream.write(chunk)
    if(/WebKitFormBoundary.+--/.test(chunk.toString())){
      socket.end('Got The Data on Server')
    }
  })
  socket.on("close", () => {
    console.log(socket.remoteAddress, ": Client disconnected");
  });

  socket.on("error", () => {
    console.log("Client Lost");
  });
  console.log("Client Connected", socket.remoteAddress);
});

server.listen(4000, "0.0.0.0", () => {
  console.log("Server started on port 4000");
});
