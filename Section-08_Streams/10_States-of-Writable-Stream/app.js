import fs from 'fs';
const writeStream = fs.createWriteStream('file.txt');
// 1. writable
/* console.log(writeStream.writable);  // true
writeStream.end();
console.log(writeStream.writable);  // false */

// 2. writableCorked

/* console.log(writeStream.writableCorked)   // 0
writeStream.cork()
console.log(writeStream.writableCorked)  // 1
writeStream.uncork()
console.log(writeStream.writableCorked) // 0 

writeStream.cork(); // Now, After this line the data is not written in file/ hard drive, it only store in RAM only and destroy without writing
writeStream.write('ABC ');
// Resume the writing we must uncork is using uncork() method
writeStream.uncork(); // Now this data is written. Because data still in internal buffer
 */

// 3. Ended
writeStream.write('ABC ');
writeStream.write('ABC ');
writeStream.end()  // this method stop writing anymore,  not immediately flushed data to the destination
console.log(writeStream.writableEnded)
console.log(writeStream.writableEnded)

// 4. Finished
console.log(writeStream.writableFinished) // take some time to flushed all data
// writeStream.destroy()
// console.log(writeStream.errored)  // null 

setTimeout(() => {
  console.log(writeStream.writableFinished)
  console.log(writeStream.writableLength) 
}, 10)