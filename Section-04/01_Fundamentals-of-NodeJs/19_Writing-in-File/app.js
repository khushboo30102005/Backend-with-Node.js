#!/usr/bin/env node
import fs from 'node:fs/promises';

/* fs.writeFile('file-1.txt', "Hello world")
fs.appendFile('file-1.txt', "\nExplore the world")

const data = await fs.readFile('file-1.txt')
console.log(data)
fs.writeFile('C:\\Users\\T14\\Desktop\\test.txt', data)
 */
/* console.log("first")

 const copyImg = await fs.readFile(process.argv[2])

 fs.writeFile(process.argv[3], copyImg)  */

/* // write time ->
setInterval(() =>{
  fs.writeFile('time.txt', new Date().toLocaleTimeString())
},1000) */

// write error in error.log ->
try {
  const fileData = await fs.readFile('cpu-imgg.jpg')
  fs.writeFile('C:\\Users\\T14\\Desktop\\test.jpg',fileData)
} catch (error) {
  const errorMsg = `${new Date().toLocaleTimeString()}\nmessage: ${error.message} \nStack: ${error.stack}\n\n`
  fs.appendFile('error.log',errorMsg)
  console.log(error)
  console.log("To see full error message got to ./error.log file.")
}