import fs from 'fs';
const readStream = fs.createReadStream('chars.txt', { highWaterMark: 4, encoding: 'utf-8' });
// readStream.setEncoding('utf-8');

readStream.on('data', (chunk) => { 
  console.log(chunk);
  // readStream.destroy('Errrrrrrr');
  // readStream.destroy(new Error('Err'));
});

readStream.on('close', () => {
  console.log('closed');
});

// readStream.on('end', () => {
//   console.log('ended');
// });
readStream.on('open', (data) => {
  console.log('opened', data);
});
// readStream.on('error', (err) => {
//   console.log({ err });
// });
