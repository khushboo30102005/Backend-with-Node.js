# 🔹 Character Encoding :

### ☑️ definition :

Character encoding is the process of converting character into binary form so that computers can store and process them.
Since computers understand only binary, so every character must be encoded.

### 🔹 Common Character Encoding Systems

#### 1️⃣ ASCII

- 7-bit encoding

- 128 characters

- Example:
  - A → 65 → 01000001

  - a → 97 → 01100001

#### 2️⃣ Extended ASCII

- 8-bit encoding

- 256 characters

#### 3️⃣ Unicode

- Supports almost all world languages

- UTF-8 is most commonly used

## 📂 Viewing Encoded Data in Files

When we save text in a file, it is stored in binary form.
We can view this stored data using the `xxd` command in Linux.

### `xxd` command :

`xxd` is a cli tool used to create `hex dump` of a file.
basic commands:

1. show hex code with 2 character group

```bash
xxd filename
```

2. show hex code with single character group

```bash
xxd -g 1 filename
```

1. show binary code with single character group

```bash
xxd -b filename
```

## 📘 UTF-8 Encoding Rules

### 🔹 What is UTF-8?

`UTF-8` (`Unicode Transformation Format – 8 bit`) is a variable-length character encoding system used to represent Unicode characters.

- Most widely used encoding on the web 🌍

- Compatible with ASCII

- Uses 1 to 4 bytes per character

### ✅ Rule 1: ASCII Compatibility (1 Byte Rule)

If the Unicode value is between `U+0000` to `U+007F`,
UTF-8 uses `1 byte (8 bits)`.

Format:

```bash
0xxxxxxx
```

- first bit : 0 (header)
- Remaining 7 bit : ASCII value (in binary)

### ✅ Rule 2: Multi-Byte Encoding Structure

If character is beyond ASCII range, UTF-8 uses multiple bytes.

Important Pattern:
|Bytes Used |Binary Pattern|
|-----------|--------------|
|1 byte |**0xxxxxxx** |
|2 bytes | **110xxxxx 10xxxxxx**|
|3 bytes |**1110xxxx 10xxxxxx 10xxxxxx**|
|4 bytes |**11110xxx 10xxxxxx 10xxxxxx 10xxxxxx**|

example :

1. !

   hex code = U+0021

   bin code = 0010 0001

   UTF-8 format encoding :

   formate : 0xxxxxxx => `00100001`

2. Ʃ : 2 byte character

hex: U+01A9

bin : 0001 1010 1001

UTF-8 format encoding :
110xxxxx 10xxxxxx => `11000110 10101001`

3. क : 3 byte character

hex: U+0915

bin : 1001 0001 0101

UTF-8 format encoding :
1110xxxx 10xxxxxx 10xxxxxx => `11100000 10100100 10010101`

