# Difference between CommonJs and ES6 module:

## CommonJs Module:

- CommonJs module use `require()` and `module.exports`.

```js
// math.js
function add(a, b) {
  return a + b;
}

module.exports = add;

// app.js
const add = require('./math');
```

- CommonJs modules loads the module/file Synchronously.

-  File Extension is optional

- if we give full path we can load any file (with any extension) in CJS.

- It is a convention to add cjs in file extension.

- It is optional to set ` "type": "commonJs"` in package.json because this module system is by default in node.js.

- In CJS `this` keyword points to module.exports by default. Executed line by line

- CJS imports (require) are not `Hoisted`.

- In CommonJs Modules (CJS), we can not use `await` outside of any function.

- Only one Value can be exported (That is an object: `module.exports`)

- Extract `dirname` and `filename` from `module wrapper function` locally in node.js.

- `Strict Mode` is not enable by Default in Cjs.
---


## ES6 Module:

- ES6 Module use `import` and `export`.
```js
// math.js
export function add(a, b) {
  return a + b;
}

// app.js
import { add } from "./math.js";
```

- ES6 modules loads the module/file Asynchronously.

-  File Extension is mandatory.

- We can't load any file in MJS , only js and mjs file are allowed.

- It is a convention to add mjs in file extension.

- we must have to set ` "type": "module"` in `package.json`

- In ES6 `this` keyword is `undefined`.

-  MJS imports (require) are `Hoisted`. In Mjs all import statements are execute first. imports are Resolved before code execution.

- In ES Modules (ESM), we can use `await` outside of any function, directly at the top of a module.

- Multiple value can be exported.

- Extract `dirname` and `filename` from `import.meta` object.

- `Strict Mode` is enable by Default in Mjs.