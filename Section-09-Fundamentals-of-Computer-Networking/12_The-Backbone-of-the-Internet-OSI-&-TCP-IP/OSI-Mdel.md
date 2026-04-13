# 🛰️ OSI Model (Open Systems Interconnection Model)

## 📌 Definition  
The **OSI Model** is a conceptual framework that explains how data travels from one device to another through **7 layers**.

---

## 🏛 Layers of OSI Model (Top → Bottom)

### 7. Application Layer  
- Closest to the **end user**  
- Handles **human-readable data**  

💡 Example:  
- Browser → Server (sending username & password)  

📡 Protocols: HTTP, HTTPS, FTP, SMTP  

---

### 6. Presentation Layer  
- Transforms data into a **readable and secure format**  

#### Tasks:
- Serialization (e.g., `JSON.stringify`)  
- Compression (reducing data size)  
- Encryption / Decryption  

💡 Example: HTTPS encryption, compressed data transfer  

---

### 5. Session Layer  
- Manages **sessions/connections** between devices  
- Creates, maintains, and terminates sessions  

💡 Example:  
- TCP sessions  
- Remote login sessions  

👉 No changes are made to actual data  

---

### 4. Transport Layer  
- Breaks data into **segments**  
- Assigns **port numbers (source & destination)**  
- Ensures:
  - Reliable delivery (**TCP**)  
  - Fast delivery (**UDP**)  

💡 Example:  
`Source Port 54321 → Destination Port 4000`  

👉 **Service-to-Service delivery**

---

### 3. Network Layer  
- Adds **IP addresses** → creates a **packet**  
- Handles routing between devices  

💡 Example:  
- Source IP: `192.168.0.5`  
- Destination IP: `142.3.4.1`  

👉 **End-to-End delivery**

---

### 2. Data Link Layer  
- Adds **MAC addresses** → creates a **frame**  
- Responsible for communication between devices on the same network  

💡 Example:  
- Source MAC: `24-9A-43-2B`  
- Destination MAC: `1A-42-F9-4B`  

👉 **Hop-to-Hop delivery**  
👉 Uses router MAC addresses (not end device MAC directly)

---

### 1. Physical Layer  
- Converts data into **physical signals**  
  (electrical, optical, radio waves)  

💡 Examples:
- Ethernet cables  
- Wi-Fi signals  
- Fiber optics  

👉 Data is physically transmitted from the device  

---

## 📦 Encapsulation & DeCapsulation  

### Encapsulation  
- Data moves from **Application → Physical layer**  
- Each layer adds its own information  

---

### DeCapsulation  
- Data moves from **Physical → Application layer (receiver side)**  
- Each layer removes its own information  

---

## 🔑 Types of Delivery  

- **Hop-to-Hop Delivery** → Data Link Layer (Layer 2)  
- **End-to-End Delivery** → Network Layer (Layer 3)  
- **Service-to-Service Delivery** → Transport Layer (Layer 4)  

---

## 📌 Important Notes 

- Applications (e.g., Node.js apps) work at the **Application Layer**  
- OSI Model is a **theoretical model**  
- In real-world networking, the **TCP/IP model** is used  

---