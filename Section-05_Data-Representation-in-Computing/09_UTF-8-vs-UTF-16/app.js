import fs from 'fs/promises'
// console.log(await fs.readFile('file.txt'))
const buffer = await fs.readFile('file.txt')
console.log(buffer)
console.log(buffer.toString('utf-16le'))



function bufferToString(buffer){
  let str = ""
  buffer.forEach(element => {
    str += (String.fromCharCode(element))
  });
  return str
}
// console.log(bufferToString(buffer2))


// console.log(String.fromCharCode(65)); // Returns "A"