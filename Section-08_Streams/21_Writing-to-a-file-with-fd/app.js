import fs from 'fs';
const fd = fs.openSync('text.txt', 'w');
const buff = Buffer.from('123')
// Pass string as second arg
fs.write(fd, 'abc', (err, bytesWritten, writtenData) => {
  console.log(bytesWritten)
  console.log(writtenData)
});


// Pass buffer as second arg
fs.write(fd, buff, (err, bytesWritten, writtenData) => {
  console.log(bytesWritten);
  console.log(writtenData);
});


// Pass Emoji (more then one byte)
fs.write(fd, '😎', (err, bytesWritten, writtenData) => {
  console.log(bytesWritten); // 2
  console.log(writtenData);
});
fs.write(fd, '₹', (err, bytesWritten, writtenData) => {
  console.log(bytesWritten); // 3
  console.log(writtenData);
});

// Pass hindi 'अ' (more then one byte)
fs.write(fd, 'अ', (err, bytesWritten, writtenData) => {
  console.log(bytesWritten); // 3
  console.log(writtenData);
});

// Pass hindi 'त्र' (more then one byte)
fs.write(fd, 'त्र', (err, bytesWritten, writtenData) => {
  console.log(bytesWritten); // 9
  console.log(writtenData);
});

// WriteSync returns writtenBytes

const writtenBytes = fs.writeSync(fd, 'त्र')
console.log(writtenBytes)