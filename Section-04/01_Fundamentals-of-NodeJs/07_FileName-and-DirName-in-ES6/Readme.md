# Filename and Dirname in ESM :
In ESM, `__filename` and `__dirname` are not automatically available like CommonJS.

In modern Node.js versions, they are exposed via the `import.meta` object as:

`import.meta`.filename

`import.meta`.dirname

Internally, these values are derived from `import.meta`.url.

### 🔹 In standard ESM (older Node versions < v20.11)

`import.meta` does NOT contain `filename` or `dirname`.

It only contains things like:
```js
{
  url: 'file:///C:/path/to/app.js',
  resolve: [Function],
  main: true
}
```
**So traditionally, we had to derive them manually:**
```js
import { fileURLToPath } from "url";
import { dirname } from "path";
console.log(fileURLToPath(import.meta.url));
console.log(dirname(fileURLToPath(import.meta.url)));
```
### 🔹 In Node.js v20.11+ (important!)

Node added experimental → then stable support for:
```js
import.meta.filename
import.meta.dirname
```

So in modern Node versions, this is now valid 👇
```js
console.log(import.meta);
```


outPut:

```js
[Object: null prototype] {
  dirname: 'C:\\Users\\T14\\Desktop\\Backend-with-Node.js\\Section-04\\01_Fundamentals-of-NodeJs\\07_FileName-and-DirName-in-ES6',
  filename: 'C:\\Users\\T14\\Desktop\\Backend-with-Node.js\\Section-04\\01_Fundamentals-of-NodeJs\\07_FileName-and-DirName-in-ES6\\app.js',
  main: true,
  resolve: [Function: resolve],
  url: 'file:///C:/Users/T14/Desktop/Backend-with-Node.js/Section-04/01_Fundamentals-of-NodeJs/07_FileName-and-DirName-in-ES6/app.js'
}
```