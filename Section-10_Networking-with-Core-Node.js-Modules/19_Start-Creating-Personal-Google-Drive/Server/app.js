import { open, readdir, readFile, rm } from 'node:fs/promises';
import http from 'node:http';
import mime from 'mime-types';
import { createWriteStream } from 'node:fs';

async function serveDirectory(req, res) {
  let [url] = decodeURIComponent(req.url).split('?');
  const itemsList = await readdir(`./storage/${url}`);
  res.setHeader('Content-Type', 'application/json');

  res.end(JSON.stringify(itemsList));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  console.log(req.method);

  if (req.method === 'GET') {
    if (req.url === '/favicon.ico') {
      const fileHandle = await open('./favicon.ico');
      const readStream = fileHandle.createReadStream();
      readStream.pipe(res);
    } else if (req.url === '/') {
      serveDirectory(req, res);
    } else {
      try {
        let [url, queryStr] = decodeURIComponent(req.url).split('?');
        const queryParams = {};
        queryStr?.split('&').forEach((pair) => {
          const [key, value] = pair.split('=');
          queryParams[key] = value;
        });

        const fileHandle = await open(`./storage/${url}`);
        const stat = await fileHandle.stat();

        if (stat.isDirectory()) {
          console.log('yes');
          serveDirectory(req, res);
        } else {
          const readStream = fileHandle.createReadStream();
          console.log(url.slice(1));
          res.setHeader('Content-Type', mime.contentType(url.split('/').pop()));
          res.setHeader('Content-Length', stat.size);
          if (queryParams.action === 'download') {
            res.setHeader(
              'Content-disposition',
              `attachment; filename=${url.slice(1)}`,
            );
          }
          readStream.pipe(res);
        }
      } catch (error) {
        res.end(`${error}`);
      }
    }
  } else if (req.method === 'OPTIONS') {
    res.end('OK');
    console.log('Options method occur');
  } else if (req.method === 'POST') {
    console.log(req.headers.filename);
    const writeStream = createWriteStream(
      `./storage/${req.headers['filename']}`,
    );
    req.on('data', (chunk) => {
      writeStream.write(chunk);
    });
    req.on('end', () => {
      writeStream.end();
      res.end('File uploaded successfully');
      console.log('uploaded');
    });
  } else if (req.method === 'DELETE') {
    req.on('data', async (chunk) => {
      try {
        const filename = chunk.toString();
        await rm(`./storage/${filename}`);
        res.end('File deleted successfully');
      } catch (error) {
        res.end(error.message);
      }
    });
  }
});

server.listen(80, '0.0.0.0', () => {
  console.log('Server started....');
});
