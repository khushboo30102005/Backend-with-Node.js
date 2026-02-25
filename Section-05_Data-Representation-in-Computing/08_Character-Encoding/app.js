import fs from 'fs/promises'
// console.log(await fs.readFile('text.txt'))
const contentBuffer = await fs.readFile('text.txt')
console.log(contentBuffer)
let binaryString = ""

contentBuffer.forEach((ele) => {
  binaryString += ele.toString('2') + " "
})
console.log(binaryString)