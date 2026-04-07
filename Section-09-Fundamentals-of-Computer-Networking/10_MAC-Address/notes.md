# 🖥️ MAC Address (Media Access Control Address)

## 📌 Definition  
A **MAC Address** is a unique hardware identifier assigned to each network interface (Wi-Fi, Ethernet, Bluetooth, etc.) at the time of manufacturing.  

- Format: **48-bit hexadecimal number**  
  Example: `00:1A:2B:3C:4D:5E`  
- Each network interface has its **own unique MAC address**

---

## 🔑 Role of MAC Address  

### 1. Permanent Identity  
- IP addresses can change (dynamic via DHCP)  
- MAC address remains **fixed (hardware level)**  

💡 This allows reliable identification of a device within a **LAN (Local Area Network)**  

---

### 2. Router’s DHCP Table  

When a device connects to a router:

1. Router assigns an **IP address**  
2. Stores mapping:  
   👉 **MAC Address ↔ IP Address**  

💡 Benefits:
- Device can be easily recognized next time  
- Sometimes the same IP is reassigned to the same MAC  

---

### 3. Communication in LAN  

- Data delivery inside a LAN happens using **MAC addresses**  
- IP address is used for **logical identification**  
- Actual data transfer at hardware level uses **MAC address**  

💡 **Core Concept:**
- IP → Logical layer  
- MAC → Physical (data link) layer  

---

## 📱 Example  

A laptop connected via:

- **Wi-Fi Interface** → `88:79:23:AF:91:CD`  
- **Ethernet Interface** → `00:1B:44:11:3A:B7`  

👉 Result:
- Router treats them as **separate devices**  
- Assigns **different IP addresses** to each  

---

## ⚡ Key Points

- IP Address = **Logical / Changeable (Dynamic)**  
- MAC Address = **Physical / Permanent (Hardware-based)**  

👉 That’s why in a router’s connected devices list,  
**MAC addresses are always visible for each device**  

---