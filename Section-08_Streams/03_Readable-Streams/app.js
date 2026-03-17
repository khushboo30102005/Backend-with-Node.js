/* import fs from 'fs/promises'

console.time();
const buff = await fs.readFile("C:\\Users\\T14\\Videos\\Captures\\virtulizations-2.mp4")
await fs.writeFile('virtulizations-2.mp4', buff)
console.timeEnd(); */

import fs from 'fs';
console.time();
const filePath = 'C:\\Users\\T14\\Videos\\Captures\\Zoom Meeting2025-05-19 17-47-52.mp4'
const stats = fs.statSync(filePath);
const readStream = fs.createReadStream(
  filePath,
  { highWaterMark: 1 * 1024 * 1024 },
);

// console.log(readStream)
let readCount = 0
let processedByte = 0
let process

readStream.on('data', (chunkBuffer) => {
  fs.appendFileSync('Zoom.mp4', chunkBuffer);
  processedByte += chunkBuffer.byteLength
  process = Math.floor((processedByte/stats.size) * 100)
  readCount++
  console.log(process)
});

readStream.on('end', () => {
  console.log({readCount})
  console.timeEnd();

});

/* let readCount = 0
const readStream = fs.createReadStream('chars.txt', {highWaterMark: 4})
readStream.on('data', (chunk) => {
  // console.log(chunk)
  readCount++
})

readStream.on('end', () => {
  console.log({readCount})
}) */
