## Internal Buffer of Readable Stream

**The chunks that we receive till the stream is ended is called as internal buffer.**

Every time this internal buffer changes with every chunk.
Internal Buffer size is equivalent to highWaterMark.

```js
stream.on('readable', () => {
  console.log(stream.readableLength);
  console.log(stream.read());
  console.log(stream.readableLength);
});
```

Here we are listening for readable event, when it fires.
It will show how much bytes of data is coming in chunk
`stream.read()` will read the data.
It will show remaining bytes of data in chunk.
