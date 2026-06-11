## Thenable Object:

A thenable object is any object that has a **.then()** method. It behaves like a Promise, even if it is not actually created using the Promise constructor.

````js
const thenable = {
  then(resolve, reject) {
    resolve("Hello from thenable!");
  }
};```

````

This object is not a Promise:

```js
console.log(thenable instanceof Promise); // false
```
But JavaScript treats it like one in many situations:
```js
Promise.resolve(thenable).then(console.log);

// Output:
// Hello from thenable!
```


### Why does JavaScript support thenables?

**The Promise specification says:**

- If an object has a callable **.then()** method, it should be assimilated (adopted) as a promise-like object.

- This allows interoperability between different libraries that implement their own promise systems.