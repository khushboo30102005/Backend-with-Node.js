import fs from 'node:fs';
// import fs from 'node:fs/promises';
// console.log(fs)

/* // fs.readFileSync()-->
const contentBuffer = fs.readFileSync('./test.txt')
const content = contentBuffer.toString()
console.log(content)
console.log("end") 

// with second arguments->
// console.time();
// const fileContent = fs.readFileSync('./test.txt', 'utf-8');
// console.log(fileContent);
// console.timeEnd();
*/

// fs.readFile() ->
// console.time();
fs.readFile('./test.txt', (err, data) =>{
  const content = data.toString()
  console.timeEnd();
  console.log("content dane")
} )

// console.log("end")


console.time();
let i = 0;
const id = setInterval(() => {
  console.log(i++);
  if (i === 30) {
    clearInterval(id);
    console.timeEnd();
  }
}, 5);
// fs.readFile() from fs.promises ->

// const fileRead =await fs.readFile('./test.txt', () => {});
// // const fileData = fileRead.toString()
// console.log('file reading done..');
// console.log('end');
