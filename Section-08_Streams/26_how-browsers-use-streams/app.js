import http from 'http';
import fs from 'fs/promises';

const server = http.createServer(async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename="river.webp"');
  const readFileHandle = await fs.open('./river.webp',
  );
  const {size} = await readFileHandle.stat();
  res.setHeader('Content-Length', size);
  const readStream = readFileHandle.createReadStream({
    highWaterMark: 10 * 1024 * 1024,
  });

  readStream.on('data', (chunk) => {
    res.write(chunk);
    readStream.pause();
    setTimeout(() => {
      readStream.resume();
    }, 1000);
  });
  readStream.on('end', () => {
    res.end();
  });
});

server.listen(4000, 'localhost', () => {
  console.log('Server Started');
});
