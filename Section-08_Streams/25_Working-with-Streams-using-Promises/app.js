import fs from 'fs/promises';

const readFileHandle = await fs.open(
  "C:\\Users\\T14\\Videos\\Captures\\Zoom Meeting 2025-05-20 17-40-32.mp4",
  'r',
);
const writeFileHandle = await fs.open('virtualizations1.mp4', 'w');

// Create Read Stream using Promises:
const readStream = readFileHandle.createReadStream();

// Create Write Stream:

const writeStream = writeFileHandle.createWriteStream();
// writeStream.write('hii')

//Pipe data
readStream.pipe(writeStream);
