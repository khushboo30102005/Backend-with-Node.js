import fs from 'fs';

const writeStream = fs.createWriteStream('zoom.mp4')
console.time();
const filePath ='C:\\Users\\T14\\Videos\\Captures\\Zoom Meeting 2025-05-21 17-43-43.mp4';
const readStream = fs.createReadStream(filePath, {
  highWaterMark: 1* 1024 * 1024,
});

readStream.on('data', (chunk) => {
  const isEmpty = writeStream.write(chunk);
  // console.log(writeStream.writableLength/ (1024 * 1024)) 
  if(!isEmpty){
    readStream.pause()
  }
});
// drain event fired when writeable internal buffer has free space to load more data
writeStream.on('drain', () => {
  readStream.resume()
})
readStream.on('end', () => {
  console.timeEnd();
});



// time 8Sec
// Memory 46MB
//Cpu 17%