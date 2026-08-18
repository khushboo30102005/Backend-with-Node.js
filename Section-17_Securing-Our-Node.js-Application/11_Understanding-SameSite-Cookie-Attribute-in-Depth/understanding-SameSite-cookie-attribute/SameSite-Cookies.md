# Understanding the `SameSite` Cookie Attribute

## 🍪 What is `SameSite`?

The `SameSite` attribute is a setting on cookies that tells browsers **when to include cookies in cross-site requests**. It was introduced to help protect web applications from **Cross-Site Request Forgery (CSRF)** attacks.

---

## 🧠 Why It Matters

Browsers automatically used to attach cookies to requests — even those initiated by other websites (like form submissions or image loads). This behavior was exploited by attackers. `SameSite` gives developers control over **when cookies should or should not be sent**.

---

## 📜 History of `SameSite`

| Year            | Event                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Before 2016** | ❌ The `SameSite` attribute did not exist. Browsers sent cookies with **all cross-site requests** by default — even malicious ones.                                   |
| **2016**        | ✅ Chrome 51 introduced support for the `SameSite` attribute (optional). Developers could set `SameSite=Strict` or `Lax` manually. It's **default value** was `None`. |
| **2020**        | 🔐 Chrome 80 (and later other browsers) changed the **default behavior**. Now, cookies **without** a `SameSite` attribute are treated as `SameSite=Lax`.              |

---

## 🔍 `SameSite` Attribute Values

### 1. `SameSite=Strict`

- Cookie is **only sent** if the request is **same-site** (same origin).
- Completely blocks cookies in all cross-site requests — even `GET` link clicks.
- ✅ Maximum protection, but can break user flows like OAuth redirects or email confirmation links.

### 2. `SameSite=Lax`

- Cookies are sent:

  - On **same-site** requests ✅
  - On **top-level cross-site GET navigations** (like link clicks) ✅

- Cookies are **not sent** on cross-site `POST`, `PUT`, or `DELETE` ❌
- ✅ This is the **default behavior in modern browsers** (since 2020)

### 3. `SameSite=None`

- Cookies are sent on **all requests**, including cross-site `POST`, `PUT`, etc. ✅
- Requires:

  - `SameSite=None`
  - `Secure` flag (must be HTTPS)

- ❗ This is the only value that **does not protect** against CSRF

---

## 🔐 Security Implications

| Value    | CSRF Protection | Use Case                                                 |
| -------- | --------------- | -------------------------------------------------------- |
| `Strict` | ✅ Strongest    | Admin panels, banking apps                               |
| `Lax`    | ✅ Good enough  | Most web apps (default)                                  |
| `None`   | ❌ None         | Needed for cross-site iframes or federated login systems |

---

## ✅ TL;DR

- Before 2016: No `SameSite` — cookies were sent everywhere
- 2016: Chrome introduced `SameSite` as an **optional** defense
- 2020: Modern browsers made `SameSite=Lax` the **default**
- Always set `SameSite` explicitly for clarity and security:

```js
res.cookie("sessionId", "abc123", {
  sameSite: "lax", // or "strict", or "none"
  secure: true,
  httpOnly: true,
});
```

> 🍪 The `SameSite` attribute is now one of the simplest and most effective defenses against CSRF.

---

## 🎥 Helpful Videos

### **Chrome for Developers**

- [SameSite Cookies - Chrome Update](https://www.youtube.com/watch?v=GPz7onXjP_4)

### **Hussein Nasser**

- [Will the New Chrome version 80 finally end Cross-Site Request forgery?](https://www.youtube.com/watch?v=ULKEr8Bdjlc)

- [SameSite Cookie Attribute Explained by Example](https://www.youtube.com/watch?v=aUF2QCEudPo)

- [A SameSite Cookie Exception was made to avoid Redirect Loop in Single Sign-On (SSO) Let us Discuss](https://www.youtube.com/watch?v=4QiD8cvzCN0)

### **LiveOverflow**

- [The Same Origin Policy - Hacker History](https://www.youtube.com/watch?v=bSJm8-zJTzQ)
