import fs from 'fs';
const readStream = fs.createReadStream('chars.txt', { highWaterMark: 4 });
// console.log(readStream.read())  // null

// readStream.on('data', (chunk) => {
//   // console.log(chunk)
// });
let i = 0
readStream.on('readable', () => {
  console.log(i, readStream.readableLength);
  console.log(readStream.read(3));
  console.log(i, readStream.readableLength);
  i++
});
