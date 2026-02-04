# 1️⃣ What is the module object in Node.js?

In `Node.js`, **every file is treated as a separate module**.

When Node runs a file, it automatically **wraps your code inside a function and provides some hidden objects**:

```js
(function (exports, require, module, __filename, __dirname) {
  // your code lives here
});
```

**👉 module is one of these built-in objects.**

## 2️⃣ What does the module object represent?

**The module object represents the current file/module.**

- It contains:
  - What this file exports

  - Where this file is located

  - How Node caches this file

  - Its relationship with other modules

## 3️⃣ Inspecting the module object

```js
console.log(module);
```

````js
Module {
  id: '.',
  path: 'C:\\project',
  exports: {},
  filename: 'C:\\project\\index.js',
  loaded: false,
  children: [],
  paths: [ ... ]
}```
````

## 4️⃣ Important properties of module

### 🔹 `module.id`

**Unique identifier of the module**

**Entry file usually has id: '.'**

```js
console.log(module.id);
```

```bash
node app.js
```

OutPut:

```js
// id of app.js that is the entry file:
.
//id of math.js file that execute by require function :
<project-root>/math.js
```

## 🔹 module.filename

**Absolute path of the current file**

```js
console.log(module.filename);
```

```js
// math.js
<project-root>/math.js
//app.js
<project-root>/app.js
```

## 🔹 module.path

**Directory of the module**
```js
console.log(module.path);
```

```js
<project-root>\03_module-object
<project-root>\03_module-object
```

## 🔹 module.exports 

**The actual object returned by require()**

Used to expose data/functions from a file
```js
console.log(module.exports);
```

Initially:
```js
{}
```
## 🔹 module.loaded

- **false while module is loading**

- **true after execution completes**
```js
console.log(module.loaded);
```

## 🔹 module.children

**List of modules required by this module**
```js
require("./test");
console.log(module.children);
```


## 🔹 module.paths

**Paths Node uses to resolve require()**
```js
console.log(module.paths);
```


**👉 This explains how Node finds node_modules.**