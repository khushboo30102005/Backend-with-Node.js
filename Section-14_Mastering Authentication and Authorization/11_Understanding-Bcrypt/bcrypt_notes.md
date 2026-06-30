# bcrypt Notes (Node.js)

## What is bcrypt?

**bcrypt** is a password hashing algorithm used to securely store
passwords. Instead of saving the original password, bcrypt converts it
into a one-way hash that is computationally expensive to crack.

> **Core Concept:** Never store plain-text passwords in a database.
> Always store hashed passwords.

## Why bcrypt?

Simple hashing algorithms like **SHA-256** are very fast. Fast hashing
is good for file integrity but **bad for passwords** because attackers
can try billions of guesses per second.

bcrypt is designed to be:

-   Slow
-   Secure
-   Salted automatically
-   Resistant to brute-force attacks

## Installation

``` bash
npm install bcrypt
```

## Hashing

``` js
import bcrypt from "bcrypt";

const hashedPassword = await bcrypt.hash(password, 10);
```

## Comparing Passwords

``` js
const isMatch = await bcrypt.compare(enteredPassword, storedHash);
```

## Salt

A random value added before hashing so the same password produces
different hashes every time.

## Cost Factor

`bcrypt.hash(password, 10)`

-   8: Low
-   10: Recommended default
-   12: High security
-   14+: Very secure but slower

## Authentication Flow

1.  User registers.
2.  Hash password with `bcrypt.hash()`.
3.  Store hash.
4.  User logs in.
5.  Find user by email.
6.  Verify using `bcrypt.compare()`.

## bcrypt vs SHA-256

  Feature                 bcrypt             SHA-256
  ----------------------- ------------------ -----------------
  Purpose                 Password hashing   General hashing
  Salt                    Automatic          Manual
  Slow                    Yes                No
  Brute-force resistant   Yes                No
  Adjustable cost         Yes                No

## Best Practices

-   Never store plain-text passwords.
-   Always use `bcrypt.compare()`.
-   Use HTTPS.
-   Keep password hashes confidential.

## Exam Questions

1.  What is bcrypt?
2.  Why is bcrypt preferred over SHA-256?
3.  What is a salt?
4.  What is the cost factor?
5.  Explain `bcrypt.hash()` and `bcrypt.compare()`.

## Core Concept Focus

-   bcrypt is designed specifically for password hashing.
-   It automatically generates a random salt.
-   The work factor makes brute-force attacks significantly slower.
-   Store only the hash, never the original password.
