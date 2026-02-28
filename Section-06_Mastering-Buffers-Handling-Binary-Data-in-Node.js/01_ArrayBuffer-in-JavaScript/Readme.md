### 🔹 What is **ArrayBuffer** in JavaScript?

**ArrayBuffer** is a built-in JavaScript object used to represent **raw binary data**.

It is like a **fixed-length block of memory** where you can store binary data (0s and 1s).

Think of it as:

> 🧠 A container of raw memory  
> 📦 But it does NOT directly let you read or write values

## 📌 Why Do We Need ArrayBuffer?

JavaScript normally works with:

- Strings
- Numbers
- Objects

But when working with:

- File handling
- Binary protocols
- WebSockets
- Images
- Audio
- Network data

We need **binary-level control** and that's where ArrayBuffer comes in.

## 📌 Important Points

1.  Fixed size (cannot resize after creation)
2.  Cannot access data directly
3.  Must use **TypedArray** or **DataView** to read/write data

## 📌 Creating an ArrayBuffer

```js
const buffer = new ArrayBuffer(8);
```

This creates **8 bytes** of raw memory.
