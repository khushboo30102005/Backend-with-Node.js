import http from "http";
import fs from 'fs/promises'

const server = http.createServer((req, res) => {
  req.on("data", (reqBody) => {
    console.log(reqBody.toString());
    fs.writeFile('t1.txt', reqBody)
  });

  res.setHeader("Content-Type", "text/txt; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end("Hello from server");
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
