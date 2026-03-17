import fs from 'fs';
const readStream = fs.createReadStream('chars.txt', { highWaterMark: 4 });

readStream.on('data', (chunk) => {
  const { bytesRead, readableHighWaterMark } = readStream;
  if (bytesRead === readableHighWaterMark) {
    fs.writeFileSync('abcd.txt', chunk);
  } else {
    fs.appendFileSync('abcd.txt', chunk);
  }

  readStream.pause();
  setTimeout(() => {
    readStream.resume();
  }, 500);
});

readStream.on('pause', () => {
  console.log("Stream Paused")
})

readStream.on('resume', () => {
  console.log('Stream Resumed')
})

/* console.log(readStream.readableFlowing); //null   -> readStream yet not stated
console.log(readStream.readableEnded); // False  -> Not end yet
console.log(readStream.isPaused()); // False   -> Not start, so not paused

readStream.pause();
console.log(readStream.isPaused()); // true


readStream.on('data', () => {
  console.log(readStream.readableFlowing); //true   -> readStream  stated
  console.log(readStream.readableEnded); // False  -> Not end yet
  console.log(readStream.isPaused()); // false
});

readStream.on('end', () => {
  console.log(readStream.readableFlowing); // True
  console.log(readStream.readableEnded); // true
  console.log(readStream.isPaused()); // false
});
 */
