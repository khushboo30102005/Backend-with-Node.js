import http from 'http'

const server = http.createServer((req, res) => {
  res.write('Hello World')
  res.end()
})

server.listen(4000, '0.0.0.0', () => {
  console.log("Http server started...")
})