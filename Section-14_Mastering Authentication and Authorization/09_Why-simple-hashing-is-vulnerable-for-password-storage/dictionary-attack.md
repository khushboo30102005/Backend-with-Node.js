# Dictionary Attack

A **Dictionary Attack** is a password-cracking technique in which an attacker tries passwords from a **predefined list (dictionary)** of common words, leaked passwords, names, phrases, and predictable combinations instead of trying every possible password.

The attack is based on the assumption that many users choose weak or commonly used passwords.

---

## How It Works

1. The attacker obtains the target password hash (or targets a login page).
2. A dictionary of common passwords is prepared.
3. Each password from the dictionary is hashed using the same hashing algorithm as the target.
4. The generated hash is compared with the stored hash.
5. If a match is found, the original password is discovered.

---

## Example

Suppose a user chooses the password:

```text
hello123
```

The attacker has the following dictionary:

```text
password
123456
admin
welcome
hello123
qwerty
```

The attacker hashes each password:

```text
SHA256("password")
SHA256("123456")
SHA256("admin")
SHA256("welcome")
SHA256("hello123")
```

When the hash of `"hello123"` matches the stored hash, the password is cracked.

---

## Why Is It Effective?

Dictionary attacks are successful because many users choose:

- Common passwords
- Dictionary words
- Simple names
- Predictable patterns
- Previously leaked passwords

Examples:

```text
password
123456
admin123
welcome
iloveyou
hello123
```

---

## How bcrypt Protects Against Dictionary Attacks

bcrypt makes dictionary attacks much slower by:

- Automatically generating a **random salt** for every password.
- Using a **computationally expensive hashing algorithm**.
- Allowing a configurable **cost factor (salt rounds)**.

Because of the unique salt, attackers must hash every password guess separately for each user.

---

## Prevention

- Use strong, unique passwords.
- Store passwords using **bcrypt**, **Argon2**, or **scrypt**.
- Increase bcrypt's cost factor.
- Enable Multi-Factor Authentication (MFA).
- Implement rate limiting and account lockout after repeated failed login attempts.

---

## Summary

A **Dictionary Attack** is a password-cracking method that tries passwords from a predefined list of commonly used words and passwords. It is faster than brute-force attacks but is less effective against strong, randomly generated passwords. Secure password hashing algorithms like **bcrypt**, combined with random salts and a suitable cost factor, significantly reduce the effectiveness of dictionary attacks.