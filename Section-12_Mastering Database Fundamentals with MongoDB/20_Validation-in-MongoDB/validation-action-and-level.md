# MongoDB Validation Action and Validation Level

## 1. Validation Action

`validationAction` decides what MongoDB should do when a document violates validation rules.

| Validation Action | Meaning |
|---|---|
| `error` | Rejects invalid documents |
| `warn` | Allows invalid documents but gives warnings |

---

## A) validationAction: "error"

- Invalid documents are rejected
- MongoDB throws an error

### Example

```js
validationAction: "error"
```

### Result

```txt
Validation failed
```

---

## B) validationAction: "warn"

- Invalid documents are allowed
- No error appears in Compass or normal console output
- MongoDB stores validation warnings in the server log file

### Example

```js
validationAction: "warn"
```

### Result

- Document gets inserted
- Warning is generated

---

# 2. Validation Level

`validationLevel` decides which documents MongoDB should validate.

| Validation Level | Meaning |
|---|---|
| `strict` | Validates all inserts and updates |
| `moderate` | Validates only valid existing documents during updates |
| `off` | Disables validation |

---

## A) validationLevel: "strict"

- Default validation level
- Every insert and update must follow validation rules

### Example

```js
validationLevel: "strict"
```

---

## B) validationLevel: "moderate"

- Existing invalid documents can remain invalid
- Useful for old collections with bad data

### Example

```js
validationLevel: "moderate"
```

---

## C) validationLevel: "off"

- Completely disables validation

### Example

```js
validationLevel: "off"
```

---

# Difference Between validationAction and validationLevel

| Feature | validationAction | validationLevel |
|---|---|---|
| Purpose | Decides what happens when validation fails | Decides which documents are validated |
| Options | `error`, `warn` | `strict`, `moderate`, `off` |

---

# Important Exam Points

## validationAction
- Controls behavior on validation failure
- `error` blocks invalid data
- `warn` allows invalid data with warnings

## validationLevel
- Controls when validation is applied
- `strict` validates everything
- `moderate` useful for old collections
- `off` disables validation