# Different open Modes:
Use Different flags:

### 1. ByDefault: Read

```js
const fd = fs.openSync('text.txt');
// OR
// const fd = fs.openSync('text.txt', "r")
fs.writeSync(fd, 'hii'); // ERROR:  bad file descriptor
```

### 2. write:

**clear file and then fill data**

```js
const fd = fs.openSync('text.txt', 'w');
fs.writeSync(fd, 'hii');
```

### 3. append:

**fill data**

```js
const fd = fs.openSync('text.txt', 'a');
fs.writeSync(fd, 'hii');
```

### 4. write and read :

**Writing and reading both**

```js
const fd = fs.openSync('text.txt', 'w+');
fs.read(fd, (err, bytesRead, buffData) => {});
fs.writeSync(fd, 'hii');
```
### 5. write and read but we have to create file first:

**Writing and reading both**

```js
const fd = fs.openSync('text.txt', 'r+');
fs.read(fd, (err, bytesRead, buffData) => {});
fs.writeSync(fd, 'hii');
```

### 6. append and read:

**fill data and read file**

```js
const fd = fs.openSync('text.txt', 'a+');
fs.read(fd, (err, bytesRead, buffData) => {});
fs.writeSync(fd, 'hii');
```
