import fs from 'fs';
/* 
const writeStream = fs.createWriteStream('file.txt')

console.log(writeStream.writableHighWaterMark)

writeStream.write('Khushboo')
writeStream.write('Saini')
writeStream.write('\nABCD') */

const writeStream = fs.createWriteStream('zoom.mp4')
console.time();
const filePath ='C:\\Users\\T14\\Videos\\Captures\\Zoom Meeting 2025-05-21 17-43-43.mp4';
const readStream = fs.createReadStream(filePath, {
  highWaterMark: 1* 1024 * 1024,
});

readStream.on('data', (chunk) => {
  writeStream.write(chunk);
});

readStream.on('end', () => {
  console.timeEnd();
});
