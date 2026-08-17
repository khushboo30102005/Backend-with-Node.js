import express from 'express';
import https from 'https';
import fs from 'fs';

const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
  res.send('Hello World');
});

const sslOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
};

/* app.listen(PORT, () => {
  console.log(`🚀 Visit http://localhost:${PORT}`);
}); */

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🚀 HTTPS server running at https://localhost:${PORT}`);
});
