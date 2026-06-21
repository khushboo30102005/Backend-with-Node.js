import crypto, { sign } from 'crypto'
import { readFile, writeFile } from 'fs/promises'
const secretKey = 'My-Loan-Agreement-Secret-Key'


const signedFileContent = await readFile('loan-agreement-signed.md', 'utf-8')
const [fileContent, signature] = signedFileContent.split('हस्ताक्षर:- ')



const newSignature = crypto.createHash('sha256').update(fileContent).update('हस्ताक्षर:- ').update(secretKey).digest('base64url')

console.log({signature, newSignature})
console.log(newSignature === signature? 'Perfect, signature is valid' : 'Invalid signature')