import fs from 'fs/promises'


const FileHandle = await fs.open('text.txt', 'w+')

console.log(FileHandle.fd)

/* const a = await FileHandle.read()
console.log(a) */

const {bytesRead, buffer} = await FileHandle.read({buffer: Buffer.alloc(10)})
console.log(buffer)
console.log(bytesRead)

// const {bytesWritten, buffer: writtenBuffer} = await FileHandle.write('hii')
const {bytesWritten, buffer: writtenBuffer} = await FileHandle.write(Buffer.from('hii'))
console.log(writtenBuffer)
console.log(bytesWritten)

FileHandle.close()
console.log(FileHandle.fd)
