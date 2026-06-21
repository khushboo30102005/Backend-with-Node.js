import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
const fileData =  readFileSync('hii.txt')
const header = Buffer.from(`blob ${fileData.length}\0`)
const newData = Buffer.concat([header, fileData])

const hash = crypto.createHash('sha1').update(newData).digest('hex')
console.log(hash)


