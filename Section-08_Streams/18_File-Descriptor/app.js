import fs from 'fs';
// console.log(process.stdin.fd); // 0
// console.log(process.stdout.fd); // 1
// console.log(process.stderr.fd); // 2

const fd1 = fs.openSync('file1.txt');

const fd2 = fs.openSync('file2.txt');

const fd3 = fs.openSync('num.txt');

console.log({fd1, fd2, fd3})
