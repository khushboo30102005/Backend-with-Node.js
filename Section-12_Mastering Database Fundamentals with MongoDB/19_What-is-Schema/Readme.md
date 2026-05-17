# Schema in MongoDB

In MongoDB, a **schema** is the structure or design of data inside a collection.

A schema defines:

* What fields a document can have
* The data type of each field
* Which fields are required
* Validation rules for the data

---

# Example Without Schema

MongoDB is called a **schema-flexible** database because documents in the same collection can have different structures.

```js
{ name: "Khushboo", age: 22 }

{ username: "Rahul", email: "rahul@gmail.com" }

{ name: "Aman", skills: ["Node.js", "MongoDB"] }
```

All these documents are different, and MongoDB still accepts them.

---

# Why Schema is Important

Without a schema:

* Data can become inconsistent
* Different documents may use different field names
* Wrong data types may get stored

Example:

```js
{ age: 22 }

{ age: "twenty two" }
```

This can create problems in applications.

---

