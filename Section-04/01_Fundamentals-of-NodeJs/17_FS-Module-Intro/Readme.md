# fs Module:
`fs` stands for `File System`.

The `fs module` is a built-in (core/native) module of Node.js that is used to work with files and directories.

## 🔥 Difference Between fs.readFileSync() and fs.readFile()

| Feature     | `fs.readFileSync()`         | `fs.readFile()`              |
| ----------- | --------------------------- | ---------------------------- |
| Nature      | **Synchronous**             | **Asynchronous**             |
| Blocking    | ✅ Blocks the event loop     | ❌ Non-blocking               |
| Execution   | Line-by-line wait karta hai | Background me kaam karta hai |
| Callback    | ❌ No callback               | ✅ Uses callback              |
| Performance | Slow in production          | Better for production        |
| Use case    | Small scripts, debugging    | Real applications / servers  |

## 🧠 Core Concept Focus
### 1️⃣ fs.readFileSync() (Synchronous)

👉 Jab tak file read nahi hoti,
next line execute nahi hogi
```js
import fs from 'fs'

const data = fs.readFileSync("test.txt", "utf-8");
console.log(data);
console.log("Done");
```

Execution flow:
```bash
Read file → wait → print data → print 
```

### 2️⃣ fs.readFile() (Asynchronous)

👉 File background me read hoti hai
👉 Program rukta nahi
```js
import fs from 'fs'

fs.readFile("test.txt", "utf-8", (err, data) => {
  if (err) throw err;
  console.log(data);
});

console.log("Done");
```

Execution flow:
```bash
Start reading → print Done → then print file data
```

## 📦 fs/promises – Modern Way

**fs/promises is a version of the fs module that works with Promises instead of callbacks.**
```js
import fs from "fs/promises";
```

## 🔥 fs.readFile() using fs/promises
#### ✅ Syntax
```js
import fs from "fs/promises";

const data = await fs.readFile(path, options);
```

**It returns a Promise.**

#### 🔄 Execution Flow
```bash
Start reading file (non-blocking)
Wait (without blocking event loop)
File resolved
Print data
```

**fs/promises.readFile() is a non-blocking method that returns a Promise and is typically used with async/await for cleaner asynchronous file handling.**J