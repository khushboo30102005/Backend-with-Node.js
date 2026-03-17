```js
console.time();
// update file path according to your system

const readStream = fs.createReadStream(filePath, {
  highWaterMark: 1 * 1024 * 1024,
});

readStream.on('data', (chunk) => {
  fs.appendFileSync('zoom.mp4', chunk);
});

readStream.on('end', () => {
  console.timeEnd();
});
```

fileSize : 3.18GB
without using writeStream this file take :
`time: 17 sec`.
`CPU: 43MB`.
`time: 12%`.

```js
const writeStream = fs.createWriteStream('zoom.mp4');
const readStream = fs.createReadStream(filePath, {
  highWaterMark: 1 * 1024 * 1024,
});

readStream.on('data', (chunk) => {
  writeStream.write(chunk);
});

readStream.on('end', () => {
  console.timeEnd();
});
```

Now this time i used writeStream and it take only `7sec`.
But 
`CPU: 515MB`.
`time: 20%`.