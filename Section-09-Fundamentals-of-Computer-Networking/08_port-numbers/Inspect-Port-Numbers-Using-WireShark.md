# 🔍 Inspecting Port Numbers

## 📌 Source & Destination Port Concept  
When one device (Source) sends a request to another device (Destination), both **IP Address + Port Number** are used.

### Example:
- Source IP: `192.168.0.4`
- Destination IP: `192.168.0.5`
- Destination Port: `80` (HTTP) or `443` (HTTPS)

💡 **Core Idea:**
- IP → Identifies the device  
- Port → Identifies the specific service/application  

---

## ⚡ Source Port Assignment  
The device sending the request is also assigned a **Source Port**.

- It is **temporary (ephemeral)**  
- Range: `49152 – 65535`  
- A new port is assigned for each new connection  

### Example:
`192.168.0.4:50512`

---

## 🛠 Packet Inspection using Wireshark  
Tools like **Wireshark** allow us to inspect real network packets and view port numbers.

### Example Capture:
- Request:  
  `192.168.0.4:50512` → `192.168.0.5:80`
- Response:  
  `192.168.0.5:80` → `192.168.0.4:50512`

💡 This shows:
- Source port is temporary  
- Destination port represents a fixed service  

---

## 🔄 Request–Response Cycle  

1. Source → Destination (sends request)  
2. Destination → Source (sends response)  

💡 **Important:**
- IP addresses are reversed  
- Port numbers are also reversed  

---

## 🌐 Real-Life Example (Browser → Website)

When you open a website in a browser:

- **Source:** Your PC (random port, e.g., `50512`)  
- **Destination:** Server (HTTP: `80` / HTTPS: `443`)  

### Flow:
1. Request is sent to the server  
2. Server sends the response back  

---

## 💡 Conclusion 

Port numbers make it possible to:
- Handle multiple connections at the same time  
- Uniquely identify each connection  

### Unique Identification:
`Source IP` + `Source Port` + `Destination IP` + `Destination Port`

✔ This combination uniquely identifies a network connection  