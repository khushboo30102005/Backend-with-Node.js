import http from "http";
import fs from "fs/promises";

const server = http.createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("Content-Type", "text/plain");

  const fileHandle = await fs.open(
    "abc.txt"
  );

  const readStream = fileHandle.createReadStream({
    highWaterMark: 1,
  });

  readStream.on("data", (chunk) => {
    res.write(chunk);

    readStream.pause();

    setTimeout(() => {
      readStream.resume();
    }, 500);
  });

  readStream.on("end", () => {
    res.end();
  });
});

server.listen(4000, "localhost", () => {
  console.log("Server Started");
});
