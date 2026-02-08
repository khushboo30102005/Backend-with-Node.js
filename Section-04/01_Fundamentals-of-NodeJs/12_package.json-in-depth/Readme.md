# 📦 What is `package.json`?

**package.json is the heart of a Node.js project.**
It is a `metadata` file that tells:

- What your project is

- Which dependencies it needs

- How to run it

- How Node.js should treat your files (CJS or ESM)

📌 Created using:

```bash
npm init
```

or

```bash
npm init -y
```

## 🧠 Why package.json is important?

- Helps npm manage dependencies

- Defines project configuration

- Enables scripts (commands)

- Controls module system (CJS vs ESM)

- Required for publishing packages

## 🧾 Basic Structure

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "My first Node.js project",
  "main": "index.js",
  "scripts": {},
  "dependencies": {},
  "devDependencies": {}
}
```

## 🔑 Important Keys & Their Functioning

### 1️⃣ name

```json
  "name": "backend-with-node"
```

- Project/package name

- Must be lowercase

- No spaces

- Required if you want to publish

📌 Used by npm registry

### 2️⃣ version

```json
"version": "1.0.0"
```

- Follows Semantic Versioning:
```bash
MAJOR.MINOR.PATCH
1 .0 .0
```
- MAJOR → breaking changes

- MINOR → new features

- PATCH → bug fixes

📌 Important for dependency control

### 3️⃣ description
```json
"description": "Learning Node.js fundamentals"
```

- Short explanation of your project

- Helpful when publishing packages

### 4️⃣ main
```json
"main": "index.js"
```

- Entry point of your project

- Used when someone imports your package

📌 If missing → defaults to index.js

### 5️⃣ type ⭐
```json
"type": "module"
```

- Controls module system

| Value      | Behavior        |
|------------|-----------------|
| commonjs   | `require()`     |
| module     | `import/export` |


📌 Without this:

- .js → CommonJS

- .mjs → ES Module

### 6️⃣ scripts ⚙️
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "test": "echo \"No tests\""
}
```

Run with:
```bash
npm run dev
npm start
```

📌 Purpose:

- Automates commands

- No need to type long `CLI commands`

### 7️⃣ dependencies'
```json
"dependencies": {
  "express": "^4.18.2"
}
```

- Libraries required in production

- Installed using:
```bash
npm install express
```

📌 Installed in node_modules

#### 🔑 Version Symbols Explained
### 1️⃣ Caret `^` (MOST COMMON)
```json
"express": "^4.18.2"
```
✅ What it means

**Allow updates that do NOT change the MAJOR version**

**`^` allows minor and patch updates but blocks major updates.**

### 2️⃣ Tilde `~`
```json
"express": "~4.18.2"
```
✅ What it means

**Allow PATCH updates only**

### 3️⃣ Greater than `>`
```json
"express": ">4.18.2"
```
✅ What it means

**Allow any version greater than this**

### 4️⃣ Greater than or equal `>=`
```json
"express": ">=4.18.2"
```
- Meaning

    Any version 4.18.2 or above

- Includes major updates

**📌 Used when you don’t care about breaking changes**

### 5️⃣ Less than `< / <=`
```json
"express": "<5.0.0"
```

or
```json
"express": "<=4.18.2"
```
- Meaning

   **Restricts upper versions**

Commonly used in combination

### 6️⃣ Exact Version (NO SYMBOL)
```json
"express": "4.18.2"
```
- Meaning

  **Install only this exact version**

- ❌ No auto updates

- ✅ Maximum stability

### 7️⃣ Wildcard `*` or `x`
```json
"express": "*"
```

or
```json
"express": "4.x"
```
Meaning

- `*` → any version (dangerous)

- `4.x` → any version starting with 4

**📌 Rarely used in real projects**

### 8️⃣ devDependencies
```json
"devDependencies": {
  "nodemon": "^3.0.0"
}
```

- Used only during development

- Not included in production builds

Install using:
```bash
npm install nodemon --save-dev
```
or
```bash
npm install nodemon --D
```
**Version symbols in package.json control how npm updates dependencies while maintaining compatibility.**