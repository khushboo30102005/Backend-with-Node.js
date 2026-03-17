import fs from 'fs';
const writable = fs.createWriteStream('file.txt')
writable.write('a')
writable.write('a')
writable.write('a')

writable.on('open', (fd) => {
  console.log("fd:", fd)
})
writable.end('\nHere file write is ended... through the end method.')  // method on writable stream to close stream. this method also take an argument that is optional, here we can pass something that we want to write in writable stream at the end. 
// this method do : 
// 1. write data if provided. 
// 2. end the stream
// 3. Trigger two events : finish and close
// writable.write("b")   // Error: Write after end

// Finish event trigger after the end of writeStream. 
writable.on('finish', () => {
  console.log("Finished........")
})
// close event trigger after the end of writeStream. 
writable.on('close', () => {
  console.log("closed........")
})