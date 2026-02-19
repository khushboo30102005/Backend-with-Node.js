# 📘 Binary Number System (Base 2)

---

## 🔹 1. What is Binary Number System?

The **Binary Number System** is a number system with **base 2**.

It uses only **two digits**:

0 and 1

Each digit is called a **bit** (Binary Digit).

---

## 🔹 2. Base (Radix)

- Binary → Base 2  
- Octal → Base 8  
- Decimal → Base 10  
- Hexadecimal → Base 16  

In binary, each position represents powers of 2.

Example:

(1011)<sub>2</sub>

Expanded form:

1 × 2³ + 0 × 2² + 1 × 2¹ + 1 × 2⁰  
= 8 + 0 + 2 + 1  
= 11<sub>10</sub>

---

## 🔹 3. Positional Value in Binary

| Position   | Power of 2 |
|------------|------------|
| Rightmost  | 2⁰ = 1     |
| Next       | 2¹ = 2     |
| Next       | 2² = 4     |
| Next       | 2³ = 8     |
| Next       | 2⁴ = 16    |

---

## 🔹 4. Binary to Decimal Conversion

### Steps:

1. Multiply each digit by 2 raised to its position.
2. Add all the results.

### Example:

Convert (1101)<sub>2</sub> to Decimal

1 × 2³ + 1 × 2² + 0 × 2¹ + 1 × 2⁰  
= 8 + 4 + 0 + 1  
= 13<sub>10</sub>

---

## 🔹 5. Decimal to Binary Conversion

### Steps (Division Method):

1. Divide the number by 2.
2. Write the remainder.
3. Divide the quotient again by 2.
4. Repeat until quotient = 0.
5. Write the remainders in reverse order.

### Example:

Convert 10<sub>10</sub> to Binary

10 ÷ 2 = 5 remainder 0  
5 ÷ 2 = 2 remainder 1  
2 ÷ 2 = 1 remainder 0  
1 ÷ 2 = 0 remainder 1  

Write remainders in reverse:

Answer:

(1010)<sub>2</sub>

---

## 🔹 6. Why Binary is Used?

- Computers understand only 0 and 1  
- Represents OFF (0) and ON (1) states  
- Used in digital circuits and programming  

---

## 🔹 7. Important Terms

- **Bit** → Single binary digit (0 or 1)  
- **Nibble** → 4 bits  
- **Byte** → 8 bits  

Example:

10101010 → 1 byte  

# 📘 Operations on Binary Numbers

Binary operations are similar to decimal operations, but calculations are done using only 0 and 1.

---

## 🔹 1. Binary Addition

### Rules of Binary Addition

| A | B | Sum | Carry |
|---|---|-----|-------|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

👉 Important:
- 1 + 1 = 10 (0 written, 1 carry)
- 1 + 1 + 1 = 11 (1 written, 1 carry)

### Example:

  1011  
+ 1101  
--------  
 11000  

---

## 🔹 2. Binary Subtraction

### Rules of Binary Subtraction

| A | B | Result | Borrow |
|---|---|--------|--------|
| 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 0 |
| 0 | 1 | 1 | 1 (borrow) |

👉 Important:
- 0 − 1 requires borrow from next higher bit.



## 🔹 3. Binary Multiplication

Binary multiplication is similar to decimal, but simpler.

### Rules:


- 0 × 0 = 0  
- 0 × 1 = 0  
- 1 × 0 = 0  
- 1 × 1 = 1  



## 🔹 4. Binary Division

Binary division follows long division method.

### Example:

Divide 1100 by 10

1100 ÷ 10 = 110  

(12 ÷ 2 = 6 in decimal)

