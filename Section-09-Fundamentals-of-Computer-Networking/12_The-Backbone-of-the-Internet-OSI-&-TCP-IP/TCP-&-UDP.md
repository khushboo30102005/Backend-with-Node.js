# ✅ TCP and UDP: The Backbone of the Internet

## 📌 Overview  
**TCP (Transmission Control Protocol)** and **UDP (User Datagram Protocol)** are core protocols of the internet.

- Both operate at the **Transport Layer (Layer 4)**  
- Many higher-level protocols are built on top of them:
  - HTTP / HTTPS  
  - QUIC  
  - WebRTC  

---

## 🔷 TCP (Transmission Control Protocol)

### 📌 Features  
- **Reliable data transfer** (point-to-point)  
- Breaks data into **segments**  
- Ensures all data is delivered correctly  
- Uses **acknowledgment & retransmission**  

---

### 🔄 3-Way Handshake (Connection Setup)  
1. **SYN** → Client requests connection  
2. **SYN-ACK** → Server acknowledges  
3. **ACK** → Client confirms  

👉 Connection is established  

---

### 💡 Key Points  
- Guarantees **data delivery & order**  
- Used for **large and important data transfer**  
- Supported by all operating systems  

---

## 🔶 UDP (User Datagram Protocol)

### 📌 Features  
- **Unreliable data transfer** (no guarantee)  
- Breaks data into **datagrams**  
- No acknowledgment or retransmission  

---

### 💡 Key Points  
- Faster than TCP  
- Used in **real-time communication**  
  - Video calls  
  - Live streaming  
  - Online gaming  

---

### 📱 Examples  
- Zoom  
- Google Meet  
👉 These use **WebRTC (built on UDP)**  

---

## 🚀 Modern Protocol: QUIC  

- Developed by **Google**  
- Built on top of **UDP**  
- Designed to improve speed and performance  

👉 **HTTP/3 is based on QUIC**  

---

## ⚖️ TCP vs UDP (Quick Comparison)

| Feature        | TCP                         | UDP                     |
|---------------|-----------------------------|--------------------------|
| Reliability   | ✅ Reliable                  | ❌ Not Reliable          |
| Speed         | Slower                      | Faster                  |
| Data Unit     | Segment                     | Datagram                |
| Use Case      | Web, Email, File Transfer   | Streaming, Gaming, Calls|
| Connection    | Connection-oriented         | Connectionless          |

---

## 💡 Final Summary (Exam Focus)

- TCP = Reliable, ordered, slower  
- UDP = Fast, no guarantee, lightweight  
- Both are **Transport Layer protocols**  
- QUIC (UDP-based) → powers **HTTP/3**  

---