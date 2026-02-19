# 📘 Hexadecimal Number System (Base 16)

---

## 🔹 1. What is Hexadecimal?

The **Hexadecimal Number System** is a number system with **base 16**.

**It uses 16 symbols:**

`0 1 2 3 4 5 6 7 8 9 A B C D E F`

Where:

- `A = 10`  
- `B = 11`  
- `C = 12`  
- `D = 13`  
- `E = 14`  
- `F = 15`  

---

## 🔹 2. Base (Radix)

- Binary → Base 2  
- Octal → Base 8  
- Decimal → Base 10  
- Hexadecimal → `Base 16`  

Each position represents powers of `16`.

Example:

(2A)<sub>16</sub>

Expanded form:

2 × 16¹ + A × 16⁰  
= 2 × 16 + 10 × 1  
= 32 + 10  
= 42<sub>10</sub>

---

## 🔹 3. Positional Value in Hexadecimal

| Position   | Power of 16 |
|------------|-------------|
| Rightmost  | 16⁰ = 1     |
| Next       | 16¹ = 16    |
| Next       | 16² = 256   |
| Next       | 16³ = 4096  |

---

## 🔹 4. Hexadecimal to Decimal Conversion

### Steps:

1. Replace letters (A–F) with decimal values.
2. Multiply each digit by 16 raised to its position.
3. Add all values.

### Example:

Convert (1F)<sub>16</sub> to Decimal

1 × 16¹ + F × 16⁰  
= 1 × 16 + 15 × 1  
= 16 + 15  
= 31<sub>10</sub>

---

## 🔹 5. Decimal to Hexadecimal Conversion

### Steps (Division Method):

1. Divide the number by 16.
2. Write the remainder.
3. Divide the quotient again by 16.
4. Repeat until quotient = 0.
5. Write the remainders in reverse order.

### Example:

Convert 45<sub>10</sub> to Hexadecimal

45 ÷ 16 = 2 remainder 13  
13 = D  

2 ÷ 16 = 0 remainder 2  

Answer:

(2D)<sub>16</sub>

---

## 🔹 6. Hexadecimal to Binary (Very Important ⭐)

Each hexadecimal digit = **4 binary bits**

| Hex | Binary |
|-----|--------|
| 0 | 0000 |
| 1 | 0001 |
| 2 | 0010 |
| 3 | 0011 |
| 4 | 0100 |
| 5 | 0101 |
| 6 | 0110 |
| 7 | 0111 |
| 8 | 1000 |
| 9 | 1001 |
| A | 1010 |
| B | 1011 |
| C | 1100 |
| D | 1101 |
| E | 1110 |
| F | 1111 |

### Example:

(3A)<sub>16</sub>

3 → 0011  
A → 1010  

Answer:

00111010<sub>2</sub>

---

## 🔹 7. Why Hexadecimal is Used?

- Compact representation of binary  
- Used in memory addressing  
- Used in color codes (CSS)  
- Used in programming and debugging  

Example (Color Code):
```css
#FF0000
```
