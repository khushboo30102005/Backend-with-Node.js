# Node.Js Module System :

**Node.js mainly supports two type of module System**

- 1. `CommonJs (CJS) Module System`
- 2. `ES Module (ESM) System`

## 1️⃣ CommonJS (CJS) — Default in Node.js

#### This is the traditional and most used module system in Node.js.

#### Exporting

```js
// math.js
function add(a, b) {
  return a + b;
}
module.exports = add;
```

#### Importing

```js
// app.js
const add = require('./math');
console.log(add(2, 3)); // 5
```

#### Key Points

- Uses require() and module.exports

- Synchronous loading

- Each file is a separate module

- Node.js wraps every file in a function internally

---

## `module.exports` :

`module.export` is an object provided by node.js that used to export data (functions, objects, variables, classes) form one file so that it can use in another file.

```js
//Initially :
module.exports = {};
// how to export data using module.exports:
module.exports = add;

//export two or more
module.exports.add = add;
module.exports.product = product;
// or:
module.exports = { add, product };
console.log(module.exports); //{ sum: [Function: sum], product: [Function: product] }
```

---

### What is `require()` :

`require()` is a built-in node.js function that used to import modules (code from another files and libraries) into the current file.

#### Argument and Return value of `require()`:

require() receive a path. It can be a file, folder and an external library.
When require() resolve the path it executes the whole file and at the end it return data that export by module.exports object.

- Argument of require() :

  require() receives a single argument called a module identifier.
  It can be path:
  - 1.  A File Path

  ```js
  require('./math.js');
  require('../utils/helper');
  ```

  - 2. A Folder Path :

  ```js
  require('./config');
  ```

  - 3. An external library

  ```js
  require('express');
  ```

#### What happens internally when require() is called?

- Node resolves the path

- Loads the module

- Executes the entire file once

- Stores the result in cache

- Returns the exported value

#### Example :

```js
// math.js
module.exports = {
  add: (a, b) => a + b,
};
```

```js
// app.js
const math = require('./math');
```

✔️ Here:

```js
require('./math') === module.exports;
```

---

## `module.exports VS exports` :

- Here `module` is main object provided by the node.js that contain exports as a key and initially exports key has empty object as value.

- `module.exports` is a property of `module` object that defines what a module exports.

- `exports` is a variable that refers `module.exports` nested object of `module` object.

```js
exports === module.exports; // true (initially)
```

- We can use `exports` instead of `module.exports` as a shortcut to add properties.

```js
exports.add = add;
```

- But `exports` can be override by another object and another data.

```js
exports.add = { add, mul };
```

- In this case, module.exports remains unchanged, and nothing is exported.

  **_exports is a reference to `module.exports`, but `require()` returns only `module.exports`; reassigning exports breaks the reference and results in an empty export._**.
