```js
const fd = fs.openSync('text.txt');
fs.read(fd, (err, bytesRead, buffData) => {
  // console.log(err);
  console.log(bytesRead);
  console.log(buffData.buffer);
  console.log(buffData.toString());
});
```

- main points:
  - **ByDefault use 16KB Buffer**
  - **We can customize it through our custom buffer.**
  - **Here we use an object of options and this object provide control over reading using its properties**
  - **some properties:**
    - `buffer`: which buffer you want to use 
    - `length`: Which byte you want read from buffer
    - `position`: from where you start reading
    - `offset`: set offset for Buffer 

```js
const fd = fs.openSync('text.txt');
const readBuffer = Buffer.alloc(10);
fs.read(fd, { buffer: readBuffer }, (err, bytesRead, buffData) => {
  // console.log(err);
  console.log(bytesRead);
  console.log(buffData.buffer);
  console.log(buffData.toString());
});
```
