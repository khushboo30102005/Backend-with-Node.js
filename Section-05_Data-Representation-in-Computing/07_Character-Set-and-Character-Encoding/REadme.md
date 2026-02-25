# 🔹Character-Set-and-Character-Encoding

## 🔹Character Set :

A character set is a defined collection of characters—including letters, numbers, symbols, and control characters—that a computer system recognizes and maps to unique numerical codes for processing and display.

### 🔹ASCII :

(American Standard Code for Information Interchange) is a `7-bit` character encoding standard representing `128 characters (0–127)` used for computers and telecommunications. It includes 33 non-printable control codes (0-31, 127) and 95 printable characters (32-126), covering English letters, numbers, and common punctuation.

#### 🔹ASCII Character Set Structure :

**Control Characters (0–31, 127)**: These are non-printable, representing commands like `LF` (Line Feed), `CR` (Carriage Return), and `BEL` (Bell).

**Printable Characters (32–126)**:

- `Space` & `Symbols` (32–47, 58–64, 91–96, 123–126): Includes standard punctuation and symbols (e.g., !, @, #, $ ).
- **Digits (48–57)**: Numerical digits 0–9.
- **Uppercase Letters (65–90)**: English letters A–Z.
- **Lowercase Letters (97–122)**: English letters a–z.

### 🔹 How ASCII Converts Characters to Binary

- Step 1: Character → Decimal ASCII Code
- Step 2: Decimal → Binary
- ✅ Example 1: Capital Letter `'A'`

ASCII decimal value of A = `65`

Convert `65` to binary:

```js
A → 65 → 1000001
```

- In 8-bit format (with leading 0):

```js
01000001;
```

### 🔹 ASCII Table (Common Characters)

| Character | Decimal | Binary (8-bit) |
| --------- | ------- | -------------- |
| A         | 65      | 01000001       |
| B         | 66      | 01000010       |
| a         | 97      | 01100001       |
| 0         | 48      | 00110000       |
| 1         | 49      | 00110001       |
| Space     | 32      | 00100000       |

#### 🔹 Why 8-bit if ASCII is 7-bit?

- Originally ASCII was 7-bit, but modern systems use 8 bits (1 byte) to store characters.

- The extra bit:
  - Used for extended characters

  - Or just kept as 0

  - This extended version is called Extended ASCII (0–255).

### 🔹Unicode :

Unicode is a **universal character encoding standard** that assigns a **unique number (code point) to every character, symbol, and emoji** across all writing systems. It solves legacy encoding issues, allowing consistent, multilingual text representation across global platforms. As of version 17.0, it supports over 297,000 characters.

#### 🔹 Key Aspects of Unicode:

- **Code Points:** Represented as `U+` followed by 4–6 hexadecimal digits (e.g., `U+0041` for '`A`').
- **Structure:** Covers modern scripts, historical scripts, symbols, and emojis, organized into blocks.
- **Encodings:**
  - **UTF-8:** The most common encoding for the web; uses 1 to 4 bytes and is `backward-compatible with ASCII`.
  - **UTF-16:** Uses 2 or 4 bytes, often used in internal software systems.
- **Universal Standard:** It is the foundational standard for text on the internet and in modern computing.

