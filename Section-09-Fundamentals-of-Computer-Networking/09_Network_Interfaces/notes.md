# 🌐 Network Interfaces

## 📌 Definition  
A **Network Interface** is the medium (usually hardware) through which a device connects to the internet or a network.  

Each interface is assigned a **unique IP address**, which helps identify the device on the network.

---

## 💻 Network Interfaces in a PC (Computer)

### 1. Wi-Fi (via Router)
- Wireless connection (most common)  
- Speed and reliability depend on the router  

---

### 2. Ethernet Cable (LAN)
- Direct wired connection (Router → PC)  
- Not all devices have an Ethernet port  
- ✔ Advantages:
  - Stable connection  
  - High speed  
  - Minimal data loss  

---

### 3. Bluetooth Tethering
- Shares internet from Mobile → PC using Bluetooth  
- Requirement: Bluetooth tethering must be enabled on the mobile  
- Creates a **PAN (Personal Area Network)**  

---

### 4. USB Tethering
- Shares internet from Mobile → PC using a USB cable  
- Requirement: USB tethering must be enabled on the mobile  
- Also creates a **PAN**  
- ✔ More stable than Bluetooth  

---

👉 **Note:**  
In both Bluetooth and USB tethering, the PC is assigned a **new IP address**, as they act as separate network interfaces.

---

## 📱 Network Interfaces in a Mobile (Phone)

- Wi-Fi (via router or hotSpot)  
- Bluetooth (tethering / PAN)  
- USB (tethering or connection to PC)  
- Cellular Data (SIM-based internet: 4G/5G)  

---

## 💡 Key Concept (Important)

- Each interface provides a **different network path**  
- If multiple interfaces are available (e.g., Wi-Fi + Ethernet), the **Operating System (OS)** decides which one to use  

---

## ⚡ Example

If a PC is connected to:
- Wi-Fi  
- USB Tethering (at the same time)  

👉 Then:
- Both interfaces will have **different IP addresses**  
- But only **one route will be active at a time** (based on OS priority)  

---