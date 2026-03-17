import fs from 'fs';
import { pipeline } from 'stream';
const writableStream = fs.createWriteStream('zoom.mp4');
console.time();
const readStream = fs.createReadStream(
  'C:\\Users\\T14\\Videos\\Captures\\Zoom Meeting 2025-05-19 17-47-52.mp4',
  { highWaterMark: 1 * 1024 * 1024 },
);

// readStream.pipe(writableStream);

setTimeout(() => {
  readStream.destroy('Khatammmm');
}, 2000);

setInterval(() => {
  console.log('HII');
}, 1000);


// Pipe method not handle error

// Way to handle error using pipe method : Using error event on readable stream

// readStream.on('error', (err) => {
//   console.log(err);
// });

// AUTOMATE THIS ERROR HANDLING USING PIPELINE FUNCTION: 
pipeline(readStream, writableStream, (err) => {
  console.log(err)
})

readStream.on('end', () => {
  console.timeEnd();
});
