import {createReadStream} from 'fs'
// const writeStream = createWriteStream('childApp.txt')


// process.stdin.on('data', (chunk) => {
//   writeStream.write(chunk)
// })

// console.log("ChildApp")

// task : Read a video file here and write from app.js

// read the data
const readStream = createReadStream("C:\\Users\\T14\\Videos\\Captures\\virtualizations1.mp4", {highWaterMark: 1 * 1024 * 1024})

// write data in process.stdout
readStream.pipe(process.stdout)