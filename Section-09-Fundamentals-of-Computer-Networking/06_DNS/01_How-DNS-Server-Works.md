# 🌐 How DNS Server Works

## 📌 DNS Lookup Flow

You can test DNS resolution using:

`nslookup <domainName>`


---

## 📶 Preference for IPv6
- If both IPv4 and IPv6 DNS servers are available, your system prefers **IPv6**
- Reason:
  - Better performance ⚡
  - Larger address space 🌍

---

## 🔐 Direct IP Access Control
- Accessing a website using a direct IP (e.g., `http://142.250.182.14`) depends on the website owner
- They can:
  - ✅ Allow access
  - ❌ Block access

---

## 🌐 Common DNS Servers
- `1.1.1.1` → Cloudflare DNS
- `8.8.8.8` → Google DNS

---

## 🔄 DNS Resolution Steps

1. **Check Browser Cache**
   - Browser checks if it already has the IP stored

2. **Check OS Cache**
   - If not found, the Operating System checks its DNS cache

3. **Ask DNS Resolver**
   - Example: `1.1.1.1` or `8.8.8.8`
   - Recursive DNS server checks its cache

4. **Query Root Server**
   - If cache miss, resolver contacts **Root DNS Server (.)**
   - Root returns TLD server info (e.g., `.com`)

5. **Query TLD Server**
   - DNS server asks for **Authoritative Name Server** of the domain

6. **Query Authoritative Name Server**
   - Returns the actual IP address of the domain

7. **Connect to Web Server**
   - Browser uses IP to load the website

---

## 🧠 What is a Name Server?

- A **Name Server** is a server that handles domain name queries
- It stores DNS records like:
  - A (IPv4)
  - AAAA (IPv6)
  - MX (Mail)
- **Authoritative Name Servers**
  - Final source of truth for domain IP

---

## ⏳ What is TTL (Time To Live)?

- TTL defines how long a DNS record is cached (in seconds)

### Example:
- `TTL = 300` → Cached for **5 minutes**

### Key Points:
- Short TTL:
  - 🔄 Faster updates
  - 📡 More DNS traffic
- Long TTL:
  - ⚡ Better performance
  - 🕒 Slower updates