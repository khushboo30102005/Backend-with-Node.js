# 🖥️ Remote Terminal Access using SSH

## 🔑 SSH (Secure Shell)

**SSH (Secure Shell)** is a network protocol that allows secure access to the terminal of one computer from another.

- Works over **TCP**
- Uses default **port 22**

---

## ⚙️ SSH Setup & Installation

### 🔍 Check if SSH is Installed

```bash
ssh -V
dpkg -l | grep openssh-client
dpkg -l | grep openssh-server
```

---

### 📦 Install SSH (if not installed)

```bash
sudo apt update
sudo apt install openssh-server
```

---

### 🔥 Allow SSH in Firewall (UFW)

```bash
sudo ufw allow ssh
```

---

### 📊 Check SSH Server Status

```bash
sudo systemctl status ssh
```

---

## 🌐 Network Details

```bash
hostname -I  // IP address
whoami    // computer's name
```

---

## 🔗 Connect (Client → Server)

```bash
ssh username@ip_address
```

### Example:

```bash
ssh aviral@192.168.1.9
```

👉 `aviral` = Username of server
👉 `192.168.1.9` = IP address of server

➡️ Enter password to login

---

## 🎯 Use Case

- Run SSH server on one system
- Connect from another system
- Control remote system via terminal

---

## 💡 Summary 

- SSH = Secure remote access
- Uses TCP port 22
- Needs client + server setup
- Provides full terminal control
