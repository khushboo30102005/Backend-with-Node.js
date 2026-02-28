## `setUint()` and `setInt()`

| Operation          | Coerced Byte | getUint8 | getInt8 |
| ------------------ | ------------ | -------- | ------- |
| `setUint8(0, 428)` | `172`        | `172`    | `-84`   |
| `setInt8(0, 428)`  | `172`        | `172`    | `-84`   |

* `setUint8` → coercion is **modulo 256**
* `setInt8` → coercion is **modulo 256**, then interpreted as signed
* Both store **same byte**: `0xAC`
* But using the correct method (`Int8` vs `Uint8`) communicates **your intention**


## how to approach what will be stored and what will be readed.


### writing
- signed and unsigned means one and same in case of writing.
- convert it into binary, collect significant bits.
- and that will the thing which will be saved.

#### eg
1. `view.setInt8(0,101);`
    - binary of 101: 0110 0101
    - significant digit: so this exact bit will be saved

2. `view.setInt8(0, 300);`
    - binary: 0001 0010 1100
    - it's significant bits: 0010 1100: these will be stored.

### reading
- here in case if MSB is 0, then it will be same for both `getInt8` and `getUint8()`
- in case if it is 1, then for `getUint8()` take 2's compliment and for `getInt8`, nothing is required to be done.

### eg
```js

// inside range

// different result(as msb is 1) for both signed and unsigned
view.setInt8(0,165);
console.log(view.getUint8(0));
console.log(view.getInt8(0));

// same result(as msb is 0) for both signed and unsigned
view.setInt8(0,101);
console.log(view.getUint8(0));
console.log(view.getInt8(0));


// outside range

// same result(as msb is 0) for both signed and unsigned
view.setInt8(0, 300);
console.log(view.getUint8(0));
console.log(view.getInt8(0));

// different result(as msb is 1) for both signed and unsigned
view.setInt8(0, 428);
console.log(view.getUint8(0));
console.log(view.getInt8(0));


```


## 🔁 Endianness (Multi-byte values)

- big endian:       left to right.
- little endian:    right to left.

### Writing

```js
view.setInt16(0, 0x57cd);           // Big-endian: stores 57 cd
view.setInt16(0, 0x57cd, true);     // Little-endian: stores cd 57
```

* Endian-ness is applied **per-byte**, not per-bit.

### Reading with Endian Awareness

```js
view.setInt16(0, 0x57cd);
view.setInt16(2, 0x1234);

view.getUint32(0);       // Reads 57cd1234 ⇒ 1473057332
view.getUint32(0, true); // Reads 3412cd57 ⇒ 840093012
```

You can swap interpretation of bytes by toggling the `littleEndian` flag.

---

## 📦 Node.js Behavior

* Node's `Buffer` object **defaults to big-endian**, and you **cannot override** it per call like with `DataView`.
* `Buffer` is closer to how C handles memory: strict, fast, but less flexible.
* `DataView` is meant for cases where **endian control per operation** is required (e.g., parsing binary file formats).

---

## 🧭 Final Rule of Thumb

1. **Writing**: Coercion applies. Use binary (or modulo) to figure out what’s stored.
2. **Reading**: Focus on MSB and endian-ness:

   * 1-byte: MSB tells if it's negative (`Int8`) or positive (`Uint8`)
   * Multi-byte: Endian determines byte order. Signed vs unsigned changes interpretation.