# Understanding CSRF Attacks and Prevention

## 🛡️ What is a CSRF Attack?

CSRF (Cross-Site Request Forgery), sometimes called **XSRF** or **Sea Surf**, is a type of web security vulnerability where a malicious website tricks a user's browser into performing unwanted actions on a trusted site where the user is authenticated.

These attacks **exploit the trust a web application has in the user’s browser** — leveraging session cookies or credentials automatically sent with requests.

---

## 🎯 Real-World Analogy

Imagine you're logged into your bank website in one tab. Then, in another tab, you visit a malicious site that silently triggers a transfer from your account. Your browser **automatically includes your bank cookies**, making the bank believe you made the request.

---

## 🔍 How It Works

1. User logs into `trusted-site.com` (e.g., a banking site).
2. The browser stores a session cookie.
3. User visits `attacker-site.com`.
4. That site auto-submits a form or script to `trusted-site.com`.
5. The browser includes the valid session cookie.
6. The trusted site processes the request as if it came from the user.

---

## 🧪 Example CSRF Attack

```html
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="1000" />
</form>
<script>
  document.forms[0].submit();
</script>
```

---

## ✅ Why It Works

* Browsers **automatically attach cookies** (like `sessionId`) to requests.
* HTML forms and images can **make cross-site POST/GET requests**.
* The server **has no built-in way to distinguish** between a real and forged request.

---

## 🔐 How to Prevent CSRF

### 1. `SameSite` Cookies

Setting the `SameSite` attribute on cookies tells browsers **when to include cookies in cross-site requests**.

```http
Set-Cookie: sessionId=abc123; SameSite=Lax; Secure; HttpOnly
```

* `SameSite=Lax` blocks cookies on most cross-origin POSTs, but allows them on top-level navigations.
* `SameSite=Strict` is even more restrictive.

### 2. CSRF Tokens (also called Anti-CSRF Tokens)

* Server generates a **unique token** per user/session.
* The token is embedded in each HTML form or request.
* The server **verifies the token** with each modifying request (like POST, PUT, DELETE).

This works because **attackers can’t read the token** from the page if same-origin policies are enforced.

### 3. Custom Headers + CORS

* Require a **custom header** like `X-CSRF-Token`.
* Browsers **block custom headers on cross-origin requests** unless allowed via CORS.

This adds a layer of protection, as attackers using HTML forms can't set these headers.

---

## 💡 TL;DR

> CSRF tricks a logged-in user’s browser into sending unwanted requests to a trusted server.

🛡️ Mitigation:

* Set cookies with `SameSite=Lax` or `Strict`
* Use **CSRF tokens** (a.k.a. **anti-CSRF tokens** or **XSRF tokens**)
* Require **custom headers** and validate CORS properly

**Don’t blindly trust requests — verify the intent behind them.**
