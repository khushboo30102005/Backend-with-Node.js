import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// const token = jwt.sign({ name: 'Khushboo' }, 'secret', {
//   expiresIn: 10
// });
// console.log(token);


// console.log(
//   jwt.verify(
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiS2h1c2hib28iLCJpYXQiOjE3ODI4NDUwNjksImV4cCI6MTc4Mjg0NTA3OX0.dwAR6yyEkv8MbFmg9tDbgRFpZJjCnWJE-rnJtVSiEkI',
//     'secret',
//   ),
// );
console.log(
  jwt.decode(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiS2h1c2hib28iLCJpYXQiOjE3ODI4NDUwNjksImV4cCI6MTc4Mjg0NTA3OX0.dwAR6yyEkv8MbFmg9tDbgRFpZJjCnWJE-rnJtVSiEkI',
  ),
);
/*  generate signature using createHmac()

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiS2h1c2hib28iLCJpYXQiOjE3ODI4NDI4MDR9.nzEtRHTrhET9P9UBy-d5aDqTFtnzRN_vfgBQPrBlkP8


console.log(Buffer.from('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiS2h1c2hib28iLCJpYXQiOjE3ODI4NDI4MDR9', 'base64url').toString())

console.log(crypto.createHmac('sha256', 'secret').update('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiS2h1c2hib28iLCJpYXQiOjE3ODI4NDI4MDR9').digest('base64url')) */
console.log(Math.round(Date.now()/1000)-1782845079)