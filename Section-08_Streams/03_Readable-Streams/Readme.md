# Streams :

### Why we need Streams: Drawback of buffer

- NodeJs restricted load data more then 2GiB, so we can't load large files using buffers.
- When we read and write big amount of data it can reduce memory performance and create a memory jump.

### Example :

**Read and write a 1.52GB file using buffer:**

```js
const buff = await fs.readFile(
  'C:\\Users\\T14\\Videos\\Captures\\virtulizations-2.mp4',
);
await fs.writeFile('virtulizations-2.mp4', buff);
```

Internal information of this task:

```
Time consumed: 4.5 seconds
Memory usages: 1575MB
CPU usages: 11%
```

## Readable Streams:

**A readable stream in Node.js is an abstraction for a source of data that can be consumed one chunk at a time, rather than loading the entire data source into memory at once.**

- The size of this is 64KB byDefault, But we can control it using `highWaterMark` option.

- **Chunked Data**: Data is processed in small, manageable pieces (chunks) as it becomes available.
- **Event-Driven**: Readable streams are instances of the EventEmitter class and emit events at various stages of data processing. Key events include `data`, `end`, `readable`, `error`, and `close`.

`createReadStream`:
**Read and write a 1.52GB file using Streams:**

```js
import fs from 'fs';
console.time();
const readStream = fs.createReadStream(
  'C:\\Users\\T14\\Videos\\Captures\\virtulizations-2.mp4',
  { highWaterMark: 1 * 1024 * 1024 },
);

readStream.on('data', (chunkBuffer) => {
  fs.appendFileSync('virtualization.mp4', chunkBuffer);
  if (chunkBuffer.byteLength < 1 * 1024 * 1024) {
    console.timeEnd();
  }
});
```

```
Time consumed: 8 seconds
Memory usages: 38MB
CPU usages: 10%
```
