# ✨ Signed and Unsigned values

**It’s about whether a number can represent negative values or not.**

## 1️⃣ Unsigned Numbers

- Can represent only positive numbers (including 0)

- No negative values

- Example (8-bit unsigned):

```js
00000000  → 0
11111111  → 255
```

For 8 bit

```js
0 to 255
```

## 2️⃣ Signed Numbers

- Can represent both positive and negative numbers

- Uses the first bit (MSB) as a sign bit

- If first bit is:

> **0 → positive**  
> **1 → negative**

Example (8-bit signed):

```js
01111111 → 127
10000000 → -128
11111111 → -1
```

### 👩‍💻 How Negative Numbers Work

Signed numbers use Two’s Complement.

- Steps to find negative value:

- Invert all bits

- Add 1

- Add negative sign

Example :
```js
11111111
```
step 1. flip the digits:
```js
00000000
```
step 2. add one:
```js
00000001
```
so value = -1