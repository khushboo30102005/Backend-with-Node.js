# JWT:

JWT stands for **JSON Web Token**. It is a compact, secure way to transmit information between parties as a JSON object. JWTs are commonly used for **authentication** and **authorization** in web applications and APIs.

## Structure of a JWT

A JWT consists of **three parts** separated by dots (.):

```plain
 xxxxx.yyyyy.zzzzz
```

### 1\. Header

Contains metadata about the token, such as the signing algorithm.

Example:

```json
{ "alg": "HS256", "typ": "JWT" }
```

### 2\. Payload

Contains the claims (data) you want to store.

Example:

```json
{ "sub": "123456789", "name": "John Doe", "role": "admin", "exp": 1719999999 }
```

Common claims:

- sub → Subject (user ID)
- name → User name
- role → User role
- iat → Issued at time
- exp → Expiration time

### 3\. Signature

Used to verify that the token hasn't been tampered with.

Example:

```js
HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret);
```

## How JWT Authentication Works

### Step 1: User Logs In

```js
  Client → ServerUsername + Password
```

### Step 2: Server Verifies Credentials

If valid, the server creates a JWT:

```js
JWT = Header.Payload.Signature;
```

### Step 3: Server Sends JWT

```js
   {  "token": "eyJhbGciOiJIUzI1NiIs..."}
```

### Step 4: Client Stores JWT

Usually in:

- Local Storage
- Session Storage
- Secure HTTP-only Cookie (recommended)

### Step 5: Client Sends JWT on Requests

```plain
   GET /api/profileAuthorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Step 6: Server Validates JWT

The server:

1.  Checks the signature.
2.  Verifies expiration (exp).
3.  Reads user information from the payload.

If valid → access granted.

## Example JWT

```js
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9
  .SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c;
```

You can decode the first two parts (header and payload), but **you cannot modify them without invalidating the signature**.

## Advantages of JWT

✅ Stateless authentication (server doesn't need session storage)

✅ Works well with REST APIs and microservices

✅ Compact and easy to send over HTTP

✅ Can contain user roles and permissions

## Disadvantages of JWT

❌ Tokens cannot easily be revoked before expiration

❌ Large payloads increase request size

❌ If stolen, an attacker can use the token until it expires

❌ Storing JWTs in Local Storage can expose them to XSS attacks

## JWT vs Session-Based Authentication

| JWT              | Session                         |
| ---------------- | ------------------------------- |
| Stateless        | Stateful                        |
| Stored on client | Session stored on server        |
| Scales easily    | Requires session storage        |
| Common for APIs  | Common for traditional web apps |
| Harder to revoke | Easy to invalidate              |

### Simple Real-World Analogy

Think of a JWT like a **signed event ticket**:

- The ticket contains your information (payload).
- The organizer digitally signs it (signature).
- Security checks the signature when you enter.
- If the signature is valid and the ticket hasn't expired, you're allowed in.

The server trusts the JWT because it can verify the signature without storing any session data.
