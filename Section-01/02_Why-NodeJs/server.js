const http = require("http")
const server = http.createServer((req, res) => {
  res.end("Hello form node.js server....")
})
server.listen(3000)