import fs from 'fs/promises'
import { text } from 'stream/consumers'
const bufferContent = await fs.readFile('text.txt')
console.log(bufferContent.toString('utf-8'))