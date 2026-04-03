# ✅ Dynamic vs Static IP Address

## 🔹 Dynamic IP Address

### 📌 Definition
A **Dynamic IP Address** is automatically assigned by a **DHCP (Dynamic Host Configuration Protocol) Server**.  
Usually, the **router acts as the DHCP server**.

---

### 📌 How it Works
- When a device connects to a network:
  - Router (DHCP server) assigns an IP automatically
- Each IP has a **lease time (expiry time)**
- After expiry:
  - A **new IP address is assigned**

---

### 📌 Example Range (DHCP Pool)
192.168.0.100 – 192.168.0.200


---

### 📌 Key Features
- Automatic IP assignment  
- Temporary (lease-based)  
- Easy to manage  

---

### 📌 Address Reservation 
- DHCP also provides **Address Reservation**
- You can bind:
  - **One device → One fixed IP**

**Benefit:**
- Router remembers the device
- Prevents **IP conflicts**

---

## 🔹 What Happens if DHCP is Disabled?

- Router will **NOT assign IP addresses**
- Devices must manually:
  - Configure IP address

**Without IP:**
- Device **cannot connect to network**

---

## 🔹 Static IP Address

### 📌 Definition
A **Static IP Address** is manually assigned to a device.  
It does **NOT change automatically**.

---

### 📌 How to Assign
- Go to device network settings
- Select **Manual / Static**
- Enter IP address manually

---

### 📌 Problem: IP Conflict ⚠️
If:
- Router assigns `192.168.0.105` dynamically  
- And you manually assign the **same IP**

Then:
- **IP Conflict occurs**
- Network connection fails

---

## 🔹 How to Prevent IP Conflict

### ✅ Best Practice: Use Separate Ranges

| Type        | Range Example                  |
|------------|-------------------------------|
| DHCP Range | 192.168.0.100 – 192.168.0.200 |
| Static IP  | 192.168.0.201 – 192.168.0.254 |

**Meaning:**
- DHCP uses one range
- Static uses another range

✔ No overlap → No conflict

---

## 🔹 Important Notes

- Static IP without planning → Conflict risk  
- Disabling DHCP → Manual setup for all devices  
- Best approach:
  - Keep DHCP ON  
  - Use Address Reservation when needed  

---

## 🎯 Quick Revision

- Dynamic IP → Automatic (DHCP-based)  
- Static IP → Manual  
- DHCP OFF → Manual IP required  
- IP Conflict → Same IP used by multiple devices  
- Solution → Separate ranges / Reservation  