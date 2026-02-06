# 📦 ES6 Modules (ESM) in Node.js
## 1️⃣ What is an ES6 Module?

**ES6 Module is the standard JavaScript module system introduced in ES6 (ECMAScript 2015).**

Node.js supports ES Modules natively, allowing you to split code into reusable files using:

`export`

`import`

📌 Each file is treated as its own module.

## 2️⃣ Enabling ES Modules in Node.js

- Node.js does not assume ESM by default.

- We can enable `ESM` in any ONE of the following ways:

#### ✅ Method 1: Using .mjs extension
```js
// math.mjs
export function add(a, b) {
  return a + b;
}
```
```js
// index.mjs
import { add } from "./math.mjs";
console.log(add(2, 3));
```
#### ✅ Method 2: Using `"type": "module"` in package.json
```js
{
  "type": "module"
}
```

**Now .js files behave as ES Modules.**

## 3️⃣ Exporting in ES Modules
#### 🔹 Named Export
```js
export const pi = 3.14;

export function area(r) {
  return pi * r * r;
}
```

OR
```js
const pi = 3.14;
function area(r) {
  return pi * r * r;
}

export { pi, area };
```
#### 🔹 Default Export
```js
export default function greet(name) {
  return `Hello ${name}`;
}
```

**📌 Only one default export per module.**

## 4️⃣ Importing in ES Modules
#### 🔹 Import Named Exports
```js
import { pi, area } from "./circle.js";
```
#### 🔹 Import Default Export
```js
import greet from "./greet.js";
```
#### 🔹 Import Everything
```js
import * as math from "./math.js";

math.add(2, 3);
```