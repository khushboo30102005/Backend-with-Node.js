# 🌐 TCP/IP Model (Transmission Control Protocol / Internet Protocol)

## 🔎 Definition  
The **TCP/IP Model** is a practical networking model used in the real-world internet.  

- OSI Model → **Theoretical (7 layers)**  
- TCP/IP Model → **Practical (4 layers)**  

👉 It simplifies OSI’s 7 layers into 4 layers  

---

## 📶 Layers of TCP/IP Model (Top → Bottom)

### 1️⃣ Application Layer  
- Combines:
  - Application + Presentation + Session (from OSI)  
- Closest to the **end user**  
- Responsible for **data generation and communication**  

📡 Protocols: HTTP, HTTPS, FTP, SMTP, DNS  

💡 Example:  
- Browser sending request to server (GET / POST)  

---

### 2️⃣ Transport Layer  
- Provides **service-to-service delivery**  

#### Protocols:
- **TCP (Segment)** → Reliable (acknowledgment, retransmission)  
- **UDP (Datagram)** → Fast, lightweight (streaming, gaming)  

📌 Port numbers are assigned here  

💡 Example:  
`Source Port: 54321 → Destination Port: 443`  

---

### 3️⃣ Internet Layer  
- Equivalent to OSI’s **Network Layer**  
- Provides **end-to-end delivery using IP addresses**  

📦 Unit: Packet  

📡 Protocols:
- IP (IPv4 / IPv6)  
- ICMP  
- ARP  

💡 Example:  
`Source IP: 192.168.1.5 → Destination IP: 142.250.74.14`  

---

### 4️⃣ Network Access Layer (Link Layer)  
- Combines:
  - Data Link + Physical layers (from OSI)  

📦 Unit: Frame / Bits  

- Uses **MAC addresses** for local delivery  
- Dependent on hardware (Ethernet, Wi-Fi, Fiber)  

💡 Example:  
`Source MAC: 24-9A-43-2B → Destination MAC: 1A-42-F9-4B`  

---

## 🛰️ Journey of Data (Step-by-Step)

1. **Application Layer**  
   - Browser creates request (HTTP)  

2. **Transport Layer**  
   - Creates segment  
   - Adds port numbers  

3. **Internet Layer**  
   - Adds IP addresses  
   - Creates packet  

4. **Network Access Layer**  
   - Adds MAC address  
   - Converts into frame & signals  

---

## 🌐 Role of Network Devices  

- **Switch** → Uses MAC address (forward frames)  
- **Router** → Uses IP address (route packets)  
- **Firewall** → Filters traffic (allow/block based on rules)  
- **Destination Server** → Performs **decapsulation** and processes request  

---

## 📌 Key Differences vs OSI Model  

- OSI = **7 layers (theoretical)**  
- TCP/IP = **4 layers (practical)**  
- TCP/IP is the **foundation of the internet**  
- OSI’s Presentation & Session layers are included in TCP/IP’s **Application layer**  

---

## 🧠 Easy Mnemonic  

**TCP/IP Layers:**  
👉 **A → T → I → N**  

- A = Application  
- T = Transport  
- I = Internet  
- N = Network Access  

💡 Memory Trick:  
**“Aaj Tera Internet Nikal gaya” 😄**

---

# OSI vs TCP/IP Model Comparison

| **OSI Model Layer**       | **TCP/IP Model Layer**   | **Data Name (PDU)**    | **Description**                                                                 |
|---------------------------|--------------------------|-------------------------|---------------------------------------------------------------------------------|
| **Application (Layer 7)** | **Application**          | **Data**               | Provides services for end-user applications like HTTP, FTP, DNS, SMTP.         |
| **Presentation (Layer 6)**| **Application**          | **Data**               | Handles data format translation, encryption, and compression.                  |
| **Session (Layer 5)**     | **Application**          | **Data**               | Manages sessions (establishment, maintenance, and termination).                |
| **Transport (Layer 4)**   | **Transport**            | **Segment (TCP)** / **Datagram (UDP)** | Ensures reliable or fast delivery with protocols like TCP or UDP.              |
| **Network (Layer 3)**     | **Internet**             | **Packet**             | Handles logical addressing (IP addresses) and routes data between networks.    |
| **Data Link (Layer 2)**   | **Network Access**       | **Frame**              | Structures packets into frames, adds MAC addresses, and manages error checking.|
| **Physical (Layer 1)**    | **Network Access**       | **Bits**               | Transmits raw binary data as electrical, optical, or radio signals.            |
