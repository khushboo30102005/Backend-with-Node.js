import { Socket } from 'node:dgram';
import { createReadStream } from 'node:fs';
import { open, readFile } from 'node:fs/promises';
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  // if (req.url == '/about.html') {
  //   const fileContent = await readFile('about.html');
  //   res.end(fileContent);
  // } else if (req.url == '/') {
  //   const fileContent = await readFile('index.html');
  //   res.end(fileContent);
  // } else if (req.url == '/services.html') {
  //   const fileContent = await readFile('services.html');
  //   res.end(fileContent);
  // }
  // else if (req.url == '/favicon.ico') {
  //   const fileContent = await readFile('favicon.ico');
  //   res.end(fileContent);
  // }

  if (req.url == '/') {
    const readStream = createReadStream('./public/index.html');
    readStream.pipe(res);
  } else {
    const readStream = createReadStream(`./public${req.url}`);
    readStream.on('error', (err) => {
      console.log(err.message)
      const readStream = createReadStream(`./public/error.html`);
      readStream.pipe(res);
    });
    readStream.pipe(res);
  }
});

server.listen(4000, '0.0.0.0', () => {
  console.log('Server started...');
});
