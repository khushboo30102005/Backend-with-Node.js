## SSH key pair

**An SSH key pair consists of a public key, which is freely shareable, and a corresponding private key, which must be kept secret by its owner.** These two mathematically linked keys are used for secure, **passwordLess authentication with remote servers** via the Secure Shell (SSH) protocol.

## What are SSH Keys?

**SSH keys are used for secure authentication without passwords.**

👉 They work in pairs:

- Private Key (Secret)
- Public Key (Shareable)

### How to Generate keys:

```powershell
  keygen
```

### Private Key

- Stored on client machine

- 📂 Location
  - 🪟 Windows:

    ```powershell
    C:\Users\<username>\.ssh\id_ed25519
    ```

  - 🐧 WSL / Linux:

    ```bash
      /home/<username>/.ssh/id_ed25519
    ```

### Public Key

- Can be shared safely
- Stored on server
- Used to verify identity
- 📂 Location
  - 🪟 Windows:
    ```powershell
    C:\Users\<username>\.ssh\id_ed25519.pub
    ```
  - 🐧 WSL / Linux:

    ```bash
    /home/<username>/.ssh/id_ed25519.pub
    ```

### Important File: authorized_keys

- Located on server side
- Contains public keys of allowed users
- Used during authentication
- 📂 Location (WSL/Linux server):

```bash
/home/<username>/.ssh/authorized_keys
```

### Working of SSH Keys (Authentication Process)

- Client tries to connect via SSH

- Server checks authorized_keys
- Server sends a challenge
- Client uses private key to sign
- Server verifies using public key
- If match → ✅ Access granted


### How to login if this file exist (that contain private key : id_ed25519) but not in .ssh directory
```powershell
ssh -i filePath <username>@ip

# Here i : Identification file
```