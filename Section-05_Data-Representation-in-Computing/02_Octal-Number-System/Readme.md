# 📘 Octal Number System (Base 8) –

## 🔹 1. What is Octal Number System?

The Octal Number System is a number system with `base 8`.
👉 It uses 8 digits only:
`0, 1, 2, 3, 4, 5, 6, 7`

If any digit is 8 or 9, it is not an octal number.

## 🔹 2. Base (Radix)

- Decimal → `Base 10`

- Binary → `Base 2`

- Octal → `Base 8`

**In octal, each position represents powers of 8**.

Example:

```math
(345)₈
```

Expanded form:

```math
3×8^2+4×8^1+5×8^0
```

## 🔹 3. Positional Value in Octal

| Position  | Power of 8 |
| --------- | ---------- |
| Rightmost | 8⁰ = 1     |
| Next      | 8¹ = 8     |
| Next      | 8² = 64    |
| Next      | 8³ = 512   |

Example:

```math
(157)₈
```
```math
1×64+5×8+7×1
=64+40+7=11110
```

## 🔹 4. Octal to Decimal Conversion
- Steps:

**Multiply each digit by 8 raised to its position power.**

**Add all results.**

Example:
```math
(25)₈
```
```math
2×8^1+5×8^0 = 16 + 5 = 21
```
## 🔹 5. Decimal to Octal Conversion

### Steps (Division Method)

1. Divide the number by 8.
2. Write the remainder.
3. Divide the quotient again by 8.
4. Repeat until quotient = 0.
5. Write the remainders in reverse order.

### Example: Convert (50)<sub>10</sub> to Octal

50 ÷ 8 = 6 remainder 2  
6 ÷ 8 = 0 remainder 6  

Now write remainders in reverse order:

**Answer:**  
(62)<sub>8</sub>

---

## 🔹 6. Octal to Binary Conversion 

Each octal digit = **3 binary bits**

| Octal | Binary |
|--------|--------|
| 0 | 000 |
| 1 | 001 |
| 2 | 010 |
| 3 | 011 |
| 4 | 100 |
| 5 | 101 |
| 6 | 110 |
| 7 | 111 |

### Example 1:

(5)<sub>8</sub> = 101<sub>2</sub>

### Example 2:

(17)<sub>8</sub>

1 → 001  
7 → 111  

Combine:

**Answer:**  
001111<sub>2</sub>

---

## 🔹 7. Why Octal is Used?

- Used in early computing systems  
- Compact form of binary  
- Used in programming environments (like file permissions in Unix/Linux)

### Example (Linux):

```bash
chmod 755 file.txt
