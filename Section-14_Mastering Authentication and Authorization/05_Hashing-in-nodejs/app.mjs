import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
const fileData = readFileSync("C:\\Users\\T14\\Downloads\\VSCodeUserSetup-x64-1.125.1.exe")
const hash = crypto.createHash('sha256').update(fileData).digest('hex')
console.log({hash})