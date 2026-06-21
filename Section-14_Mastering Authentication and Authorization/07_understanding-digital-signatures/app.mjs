import crypto from 'crypto'
import { readFile, writeFile } from 'fs/promises'
const fileContent = await readFile('loan-agreement.md')
const secretKey = 'My-Loan-Agreement-Secret-Key'
const signature = crypto.createHash('sha256').update(fileContent).update(secretKey).digest('base64url')
console.log(signature)
const newFile = await writeFile('loan-agreement-signed.md', `${fileContent}${signature}`)


// What we do : in simple language
// signature = createHash(originalData + secretData)
// signedFile = originalData + signature


