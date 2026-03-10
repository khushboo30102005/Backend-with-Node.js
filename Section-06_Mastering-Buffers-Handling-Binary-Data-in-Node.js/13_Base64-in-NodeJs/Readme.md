
# 📌 Base64 and Base64URL in Node.js

* * *

# 1️⃣ What is Base64?

**Base64** is a binary-to-text encoding scheme that converts binary data into ASCII characters.

It is mainly used when:

*   Sending binary data over HTTP
    
*   Storing binary data in JSON
    
*   Encoding images/files in APIs
    
*   JWT tokens
    
*   Email attachments (MIME)
    

* * *

## 🔹 Why Base64 is Needed?

Some systems only support **text data**, not raw binary.  
Base64 converts binary into safe printable characters.

* * *

## 🔹 Base64 Character Set

Base64 uses **64 characters**:
```
A–Z  (26)  
a–z  (26)  
0–9  (10)  
+    (1)  
/    (1)  
=    (Padding)
```
Total = 64 characters

## 🔹 Encoding to Base64

# 

const str \= "hello";  
const encoded \= Buffer.from(str).toString("base64");  
  
console.log(encoded);  
// aGVsbG8=

* * *

## 🔹 Decoding from Base64

# 

const encoded \= "aGVsbG8=";  
const decoded \= Buffer.from(encoded, "base64").toString();  
  
console.log(decoded);  
// hello

* * *


# 5️⃣ What is Base64URL?

## 

Base64URL is a **URL-safe version of Base64**.

Problem with normal Base64:

*   `+` and `/` are not URL-safe
    
*   `=` padding can cause issues in URLs
    

## 🔹 Base64URL Character Set

## 

Changes from Base64:

| Base64 | Base64URL |
| --- | --- |
| + | - |
| / | _ |
| = | removed |

So it becomes URL-safe.