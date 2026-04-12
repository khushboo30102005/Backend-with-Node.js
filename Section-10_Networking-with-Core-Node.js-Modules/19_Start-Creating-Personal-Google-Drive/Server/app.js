import { open, readdir, readFile } from 'node:fs/promises';
import http from 'node:http';
import mime from 'mime-types';

async function serveDirectory(req, res) {
  let [url, queryStr] = decodeURIComponent(req.url).split('?');
  const itemsList = await readdir(`./storage/${url}`);
  let dynamicHtml = '';
  itemsList.forEach((item) => {
    dynamicHtml += `${item} <a href = '.${url === '/' ? '' : url}/${item}?action=open'>Open</a>  <a href = '.${url === '/' ? '' : url}/${item}?action=download'>Download</a><br>`;
  });

  const htmlBoilerPlate = await readFile('./boilerPlate.html', 'utf-8');
  res.end(htmlBoilerPlate.replace('${dynamicHtml}', dynamicHtml));
}

const server = http.createServer(async (req, res) => {
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
      queryStr.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        queryParams[key] = value;
      });

      const fileHandle = await open(`./storage/${url}`);
      const stat = await fileHandle.stat();

      if (stat.isDirectory()) {
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
});

server.listen(80, '0.0.0.0', () => {
  console.log('Server started....');
});
