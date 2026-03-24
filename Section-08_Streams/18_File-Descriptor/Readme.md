# File Descriptor (FD)

**A File Descriptor (FD) is a non-negative integer assigned by the operating system to identify an open file, socket, or other I/O resource.**

### Key points

- **It is a non-negative integer ✅**

- I**t is created when a file or I/O resource is opened ✅**

- **It identifies resources like:**

  - *files*

  - *sockets*

  - *pipes*

  - *terminals*

#### Example (Unix / Node.js)

**Standard file descriptors:**

```bash
0 → stdin
1 → stdout
2 → stderr
```