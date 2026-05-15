# 🧠 MongoDB Structure (Core Concept)

MongoDB stores data in a hierarchical format:

```
Database → Collection → Document
```

## 🔄 SQL vs MongoDB Mapping

| MongoDB   | Traditional SQL |
|----------|-----------------|
| Database | Database        |
| Collection | Table         |
| Document | Row            |

---

# 📦 1. Database

A **Database** is the top-level container in MongoDB.

- Stores multiple **collections**
- Used to organize related data

### Example
```bash
collegeDB
```

### Contains collections like:
- students  
- teachers  
- courses  

---

# 📁 2. Collection

A **Collection** is a group of related documents.

- Similar to a **table in SQL**
- Does **not enforce strict schema**

### Example
```bash
students
```

👉 This collection stores student records.

---

# 📄 3. Document

A **Document** is the actual data stored in MongoDB.

- Stored in **JSON-like format (BSON)**
- Flexible structure (schema-less)

### Example
```json
{
  "name": "Khushboo"
  "course": "MCA"
}
```

### Key Features:
- Documents can have **different structures**
- Fields can be **added/removed dynamically**

---

# 🔥 Important Point

- MongoDB is **Schema-less**
- Documents in the same collection **do not need identical structure**

---

## 🎯 Real-Life Example (Project Based)

## Database
```
fileStorageDB
```

## Collection
```
files
```

## Document
```json
{
  "filename": "resume.pdf",
  "size": "2MB",
  "uploadedBy": "Khushboo"
}
```

---

# ⚡ One-Line Revision

- **Database:** Container of collections  
- **Collection:** Group of documents  
- **Document:** Actual data (JSON format)  



# MongoDB: DB Request vs Heartbeat Request

---

## 🟢 1. DB Request in MongoDB

### 👉 What it means
A **DB request** is any **actual operation your application sends to MongoDB**.

---

### 💡 Examples

```js
db.users.find()
db.users.insertOne({ name: "Khushboo" })
db.users.updateOne({ name: "Khushboo" }, { $set: { age: 22 } })
```

➡️ Each of these creates a database request

### 🔁 Types of DB Requests
- `Query` (find)

- `Insert` (insertOne, insertMany)
- `Update` (updateOne, updateMany)
- `Delete` (deleteOne, deleteMany)
- `Aggregate` (aggregate)

🧠 Simple Meaning

**DB Request = "Do some work on database" message**

## 🟡 2. Heartbeat Request in MongoDB

👉 What it means

A heartbeat request is a small periodic check sent to verify:

> "Hey MongoDB server, are you still alive?"

### 💡 Why it exists

MongoDB (especially in clusters / replica sets) uses heartbeat to:

- Detect server failures

- Maintain connection health
- Sync cluster state

### 🔁 Where it's used

- Between MongoDB servers (replica set members)
- Between client driver and MongoDB server

🧠 Simple Meaning

**Heartbeat = "Are you alive?" ping message**