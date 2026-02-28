# Decode data from ArrayBuffer using TypedArray:

```js
const uint8Array = new Uint8Array(8);
console.log(uint8Array); // Uint8Array(8) [ 0, 0, 0, 0, 0, 0, 0, 0 ]
// Write data manually in this case
uint8Array[0] = 0x50;
uint8Array[1] = 0x72;
uint8Array[2] = 0x6f;
uint8Array[3] = 0x43;
uint8Array[4] = 0x6f;
uint8Array[5] = 0x64;
uint8Array[6] = 0x72;
uint8Array[7] = 0x72;

// decode data using TextDecoder
const decoder = new TextDecoder('utf-8');
console.log(decoder.decode(uint8Array)); // ProCodrr
console.log(uint8Array); // Uint8Array(8) [ 80, 114, 111,  67, 111, 100, 114, 114 ]
```

#### Write this data in a file :

1. data as TypedArray:

```js
fs.writeFile('buffer-text.txt', uint8Array);
```

2. data as view:

```js
const view = new DataView(uint8Array.buffer);
fs.writeFile('buffer-text.txt', view);
```

```txt
ProCodrr
```

### transfer the data of ArrayBuffer within the network:

- Using Server this data can be transfer into Network.
- Read this ArrayBuffer using JavaScript on live server:

```js
fetch('http://localhost:3000/')
  .then((res) => res.arrayBuffer())
  .then((data) => {
    console.log(data);
    const decoder = new TextDecoder('utf-8');
    console.log(decoder.decode(data));
  });
```
