import crypto from 'crypto'
const salt = crypto.randomBytes(16)
const password = crypto.pbkdf2('password', salt, 100000, 32, 'sha256', (err, derivedKey) => {
  console.log(derivedKey)
console.log(derivedKey.toString('base64url')+'.'+ salt.toString('base64url'))
})