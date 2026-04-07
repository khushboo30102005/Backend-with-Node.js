# 🔥 Firewall (Network Security System)

## 📌 What is a Firewall?  
A **Firewall** is a network security system that monitors and controls **incoming (inbound)** and **outgoing (outbound)** traffic based on predefined rules.  

💡 It acts like a **security gatekeeper** that decides whether traffic should be **allowed or blocked**.

---

## 🌐 Types of Network Profiles  

### 1. Public Network  
- Used in open places (e.g., coffee shop Wi-Fi)  
- ⚡ **Most strict security rules**  
- Device discovery is **disabled** (no file sharing, no printer access)  

---

### 2. Private Network  
- Used in trusted environments (e.g., home Wi-Fi)  
- Rules are **less strict**  
- Device discovery is **enabled** (file sharing, printers allowed)  

---

### 3. Domain Network  
- Used in **organizations / enterprises**  
- Security rules are **centrally managed by servers**  
- High control and monitoring  

---

## 🔄 Inbound vs Outbound Rules  

### 🚪 Inbound Rules (Incoming Traffic)  
- Control traffic coming **from outside → into your system**  
- **Default: Blocked (for security)**  

#### Example:
- Remote Desktop (RDP) access from outside  
- Hosting a web server (port `80`) → requires inbound rule  

---

### 🌐 Outbound Rules (Outgoing Traffic)  
- Control traffic going **from your system → to outside**  
- **Default: Allowed**  

#### Example:
- Opening a website (e.g., google.com)  
- Sending requests to internet services  

💡 In enterprise networks:
- Outbound traffic may be **restricted**  
- Example: Blocking torrents or unauthorized apps  

---

## 👉 Summary  

- **Inbound** = Outside → Inside (**Default: Block 🔒**)  
- **Outbound** = Inside → Outside (**Default: Allow ✅**)  

---

## 🕵️ Deep Packet Inspection (DPI)  

Advanced firewalls perform **Deep Packet Inspection (DPI)**:

- Analyze **packet content**, not just headers  
- Detect and block:
  - Malware  
  - Spam  
  - Suspicious or unauthorized traffic  
  - VPN tunneling (in restricted networks)  

---

## 💡 Quick Recap 

- Firewall = **Security Gatekeeper** 🚪  
- Public Network = **Most Secure (Strict rules)**  
- Private Network = **Trusted (Relaxed rules)**  
- Domain Network = **Enterprise Control**  
- Inbound = **Controls incoming traffic (Blocked by default)**  
- Outbound = **Controls outgoing traffic (Allowed by default)**  
- DPI = **Deep inspection of packet data**  

---