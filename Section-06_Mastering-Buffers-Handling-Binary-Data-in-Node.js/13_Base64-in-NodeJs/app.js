import fs from 'node:fs/promises';
//Equivalent to btoa() :
/* 
const a = await fs.readFile('text.txt', 'base64')   
console.log(a) */

/* const bufferContent = await fs.readFile('text.txt')
const a = bufferContent.toString('base64')
console.log(a)
//Equivalent to atob() :

// fs.writeFile('newFile.txt', 'YWJj', 'base64')


fs.writeFile('newFile.txt', a)  // Increase file size with 8/6 => 4/3  */

// write favicon

// const bufferContent = await fs.readFile('newFile.txt');
// const a = bufferContent.toString();
// const bufferContentJs = await fs.readFile('script.js');
// const js = bufferContentJs.toString('base64');
// fs.writeFile('js.txt', js);
 
const bufferContent = await fs.readFile('favicon/favicon-16x16.png')    // size of this file : 657bytes
const a = bufferContent.toString('base64')
console.log(a)
fs.writeFile('newFile.txt', a)   // now, size of this file : 4/3 * 657 = 876bytes

const videoBuffer = await fs.readFile('Screen Recording 2026-03-04 164345.mp4')
const video = videoBuffer.toString('base64')
// console.log(video);
fs.writeFile('video.txt', video)

/* const imageBuffer = await fs.readFile('ChatGPT Image Feb 24, 2026, 09_37_35 PM.png')
const image = imageBuffer.toString('base64url')
// console.log(image);
fs.writeFile('imageUrl.txt', image)
 */

// const fileContent = await fs.readFile('text.txt')
// const fileUrl = fileContent.toString('base64url')
// fs.writeFile('fileUrl.txt', fileUrl)
// console.log(fileContent.toString('base64url'))