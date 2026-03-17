import fs from 'fs';
const writableStream = fs.createWriteStream('zoom.mp4');
console.time();
const readStream = fs.createReadStream(
  'C:\\Users\\T14\\Videos\\Captures\\Zoom Meeting 2025-05-19 17-47-52.mp4',
  { highWaterMark: 1 * 1024 * 1024 },
);

writableStream.on('pipe', (src) => {
  console.log('Piped from:', src.constructor.name);
});

readStream.pipe(writableStream);
// Pipe method on readable stream takes writable stream as an argument
// This method writes data in writable stream from readable stream
// It give facility to handle backPressure automatically.
// This Method trigger pipe method on writable Stream
// Also trigger unpipe method after complete its work.

setTimeout(() => {
  readStream.unpipe(writableStream)
}, 2000)

// Unpipe method stop the transformation of data.
// This method trigger unpipe event on writable stream.

writableStream.on('unpipe', (src) => {
  console.log('UnPiped:', src.constructor.name)
})

/* Process of handle backPressure with writing data :  
readStream.on('data', (chunk) => {
  const isEmpty = writableStream.write(chunk);
  if (!isEmpty) {
    readStream.pause();
  }
});

writableStream.on('drain', () => {
  readStream.resume();
}); */
readStream.on('end', () => {
  console.timeEnd();
});
