import express from 'express';
import http from 'node:http';

const app = express();
// app is the handler function (request listener) of http server
const server = http.createServer(app);

const port = 3000;

app.get('/', (req, res) => {
  res.end('HELLO WORLD');
});

app.get('/test', (req, res) => {
  res.end('HELLO TEST');
});

// app.listen(port)

server.listen(port)
