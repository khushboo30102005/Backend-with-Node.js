# ⚠️ DNS Hijacking using Hosts File

## 📌 What is Hosts File?

- The **hosts file** is a local file in your system that maps:
  - **Domain names → IP addresses**
- Your system checks this file **before querying any DNS server**

---

## 🔄 How it Works

1. You enter a domain (e.g., `www.google.com`)
2. System first checks the **hosts file**
3. If a match is found:
   - It directly uses that IP ❗
   - DNS server is **NOT contacted**

---

## 🧠 DNS Hijacking Concept

- By modifying the hosts file, you can override DNS resolution locally
- This technique is called **DNS Hijacking (local level)**

---

## ⚙️ What You Can Do

### 1. 🔀 Redirect a Website

- Example: `http://www.google.com/`

- This will redirect Google to your local machine

---

## ⚠️ Important Notes

- Requires **administrator/root access** to edit
- Works only on **your local system**
- Common file locations:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux/Mac: `/etc/hosts`

---

## 🔐 Security Insight

- Malicious programs can modify the hosts file to:
- Redirect users to fake websites (phishing)
- Always verify your hosts file if something seems suspicious 🚨

## MY TRY:

1. Write this line in hosts file :

`127.0.0.1 www.example.com`

2. Open live server using `index.html`.

3. Flush DNS Cache:
   - Open Command Prompt (as admin) and run:

   ```cmd
   ipconfig /flushdns
   ```

4. Now Open chrome and search :

```browser
http://www.example.com:5500/
```
