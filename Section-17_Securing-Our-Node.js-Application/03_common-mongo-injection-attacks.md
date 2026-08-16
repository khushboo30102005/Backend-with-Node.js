## 🔥 Common MongoDB Injection Vectors

### 🔹 1. **Logical Operators**

| Operator  | Risk                       | Example                            |
| --------- | -------------------------- | ---------------------------------- |
| `$ne`     | Matches anything not null  | `{ name: { $ne: null } }`          |
| `$gt`     | Matches anything "greater" | `{ name: { $gt: "" } }`            |
| `$exists` | Bypasses required fields   | `{ password: { $exists: false } }` |

---

### 🔹 2. **Regex Injection**

```js
find({ username: { $regex: req.body.username } })
```

Attack input:

```json
{ "username": ".*" }
```

→ matches all usernames.
Can also cause **ReDoS (regex denial of service)** if the regex is complex or nested.

---

### 🔹 3. **Array Injection**

If you're using `$in` and accept user input as an array:

```js
find({ role: { $in: req.body.roles } })
```

Attack input:

```json
{ "roles": [ { "$ne": "admin" } ] }
```

→ This can match any role that's not "admin".

---

### 🔹 4. **Nested Operators via JSON Parsing**

If you do something like:

```js
const filters = JSON.parse(req.body.query); // 🧨 dangerous
find(filters);
```

Then the attacker can send:

```json
{ "isAdmin": { "$ne": false } }
```

→ and bypass any role-based condition.

---

### 🔹 5. **Projection Abuse**

If you allow projections from user input:

```js
find({}, req.body.fields)
```

And the attacker sends:

```json
{ "password": 1 }
```

→ They can extract sensitive fields like hashed passwords or tokens.

---

### 🔹 6. **Command Injection (less common but real)**

Some older MongoDB driver setups or ORMs allow users to specify parts of the query pipeline — if not validated, a user could inject:

```js
{ "$where": "this.password.length < 100" }
```

→ which executes raw JavaScript in Mongo (⚠️ `eval`-like behavior).

---

## 🛡️ How to Prevent Mongo Attacks

| Strategy                               | Description                                                           |
| -------------------------------------- | --------------------------------------------------------------------- |
| **Use Zod or similar**                 | Validate all user input before passing to Mongo queries               |
| **Never trust objects from client**    | Don’t allow `{ key: { $ne: null } }` to be constructed from raw input |
| **Avoid passing raw query/filter**     | Don’t do `find(req.body)`                                             |
| **Whitelist fields explicitly**        | Only accept known filter keys and sanitize values                     |
| **Cast IDs with `ObjectId.isValid()`** | Prevent ID-based injection attacks                                    |

---

## ✅ Summary of Risky Operators for Mongo Injection

| Type       | Operators                                        |
| ---------- | ------------------------------------------------ |
| Logic      | `$ne`, `$gt`, `$lt`, `$exists`, `$eq`            |
| Regex      | `$regex`, `$options`                             |
| Array      | `$in`, `$nin`                                    |
| JS Eval    | `$where`, `$function`, `$accumulator`            |
| Projection | dynamic field selection (e.g. `{ password: 1 }`) |

---

Let me know if you want a reusable `sanitizeMongoInput()` function or secure query-building wrapper.
