import fs, { createWriteStream } from 'fs';
console.time();

//TIME: 53Sec
for (let i = 1; i <= 100000; i++) {
  if (i === 1) {
    fs.writeFileSync('number.txt', `${i} `);
  } else {
    fs.appendFileSync('number.txt', `${i} `);
  }
}
console.timeEnd();

// TIME: 550ms
const writeStream = createWriteStream('streamNumbers.txt');
for (let i = 0; i <= 100000; i++) {
  writeStream.write(`${i} `);
}

writeStream.end();
writeStream.on('finish', () => {
  console.timeEnd();
});
