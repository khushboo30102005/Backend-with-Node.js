import fs from 'fs';

const writeStream = fs.createWriteStream('file.txt', { highWaterMark: 4 });

// console.log(writeStream.writableHighWaterMark);
let i = 1;
write1000As();

writeStream.on('drain', () => {
  // console.log('Drain', writeStream.writableLength);
  console.log('***************************');
  write1000As();
});

function write1000As() {
  while (i <= 1000) {
    // console.log(writeStream.writableLength);
    let isEmpty = writeStream.write('a');
    i++;
    if (!isEmpty) {
      break;
    }
    console.log(isEmpty);
  }
}
