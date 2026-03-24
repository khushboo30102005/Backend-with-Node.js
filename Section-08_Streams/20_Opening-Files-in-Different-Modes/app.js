import fs from 'fs';

const fd = fs.openSync('text.txt', 'r+');
fs.read(fd, (err, bytesRead, buffData) => {});
fs.writeSync(fd, 'hii');
