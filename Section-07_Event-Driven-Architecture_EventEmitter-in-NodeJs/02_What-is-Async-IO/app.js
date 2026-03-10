import fsPromises from 'node:fs/promises';
import fs from 'node:fs';

setTimeout(() => {
  console.log("Hii")
}, 0)
// Async I/O
console.time();
const fileContent = await fsPromises.readFile('nodeJs.txt', 'utf-8');

// const fileContent = fs.readFile('nodeJs.txt', 'utf-8', (err, data) => {
//   console.log(data)
// })

// sync I/O
// const fileContent =  fs.readFileSync('nodeJs.txt', 'utf-8');

console.log(fileContent)
console.timeEnd();
console.log("endddddd")
