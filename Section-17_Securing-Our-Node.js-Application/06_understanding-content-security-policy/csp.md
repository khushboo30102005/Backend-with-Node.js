# Content Security Policy (CSP)

## 🛡️ What is Content Security Policy?

Content Security Policy (CSP) is a **security standard** introduced to prevent various attacks such as **Cross-Site Scripting (XSS)**, **clickjacking**, and **code injection** by controlling which resources (scripts, styles, images, etc.) a browser is allowed to load and execute on a web page.

> Think of CSP as a "whitelist" mechanism for web resources.

---

## 📌 Why is CSP Important?

Without CSP, browsers will load and run any script or resource included in a web page. This opens the door to attackers injecting malicious scripts (XSS), stealing cookies, or manipulating DOM.

CSP helps:

- Prevent inline scripts/styles from executing
- Block unauthorized external resources
- Reduce attack surface for XSS and data injection
- Mitigate clickjacking with directives like `frame-ancestors`

---

## 🧱 How Does CSP Work?

CSP is delivered via **HTTP response headers** or a `<meta>` tag in the HTML.

### Example (HTTP Header):

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com
```

### Example (Meta Tag):

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'"
/>
```

---

## 🧩 Key CSP Directives

| Directive         | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `default-src`     | Fallback for all other resource types (scripts, styles, etc.) |
| `script-src`      | Allowed sources for JavaScript                                |
| `style-src`       | Allowed sources for CSS                                       |
| `img-src`         | Allowed sources for images                                    |
| `font-src`        | Allowed sources for fonts                                     |
| `connect-src`     | Controls where `fetch`, `XHR`, WebSockets can connect         |
| `frame-ancestors` | Restricts which domains can embed the page in an iframe       |
| `object-src`      | Controls loading of plugins like Flash (mostly obsolete)      |
| `media-src`       | Controls audio/video sources                                  |

---

## 🚨 Dangerous Sources to Avoid

| Source            | Why It's Dangerous                                             |
| ----------------- | -------------------------------------------------------------- |
| `'unsafe-inline'` | Allows inline scripts/styles, defeats CSP's XSS protection     |
| `'unsafe-eval'`   | Allows `eval()` and similar, risky execution of arbitrary code |

> Only use these in development or when absolutely necessary with strong justification.

---

## ✅ Recommended Practices

- Always define a **strict `default-src`**
- Use `'self'` wherever possible (means same-origin)
- Avoid `'unsafe-inline'` and `'unsafe-eval'`
- Use **nonces** or **hashes** for inline scripts if needed
- Define `frame-ancestors 'none'` to block clickjacking

---

## 🔍 Example: Strict CSP Header

```http
Content-Security-Policy: \
  default-src 'self'; \
  script-src 'self' https://cdn.example.com; \
  style-src 'self' https://fonts.googleapis.com; \
  img-src 'self' data:; \
  font-src 'self' https://fonts.gstatic.com; \
  connect-src 'self'; \
  frame-ancestors 'none';
```

---

## 🧪 Testing Your CSP

- Use browser dev tools → Network tab → check for CSP headers
- Tools:

  - [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

## ⚠️ Common Mistakes

- Overusing `'unsafe-inline'` or `'unsafe-eval'`
- Not testing third-party integrations (CDNs, analytics)
- Setting CSP via meta tags only — headers are preferred

---

## 🧰 Tools and Libraries

- `helmet` (for Express.js):

  ```js
  import helmet from "helmet";
  app.use(helmet());
  ```

- Online CSP generators
- Security scanners like Mozilla Observatory

---

## 📦 CSP Reporting

You can ask browsers to send violation reports:

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-violation-report-endpoint
```

---

## 📚 Conclusion

CSP is a powerful and flexible tool to secure your web applications against client-side attacks. While it can be complex to configure initially, using CSP properly can drastically reduce the risk of XSS, clickjacking, and other browser-based exploits.

> "Don't wait for a breach to enforce your content boundaries. CSP is your first line of browser defense."
