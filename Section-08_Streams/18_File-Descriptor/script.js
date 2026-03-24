import fs from'fs'
fs.open('num.txt', (err, fd) => {
  console.log(fd)
})