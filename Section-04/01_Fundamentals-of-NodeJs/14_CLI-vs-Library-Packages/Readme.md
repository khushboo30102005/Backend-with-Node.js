# CLI Packages vs Library Packages

## 1️⃣ CLI Packages (Command Line Interface)

What they are

- Packages meant to be used from the terminal

- They expose commands, not functions

- Usually installed globally or run via npx

### Key traits

- Executed as commands

- Often use a shebang (#!/usr/bin/env node)

- Entry point defined in package.json using "bin"

- Output goes to terminal (logs, files, errors)

- Examples
  - `npm, npx`

  - `eslint`

  - `prettier`

  - `nodemon`

  - `create-react-app`

  - `vite`

## 2️⃣ Library Packages

What they are

- Packages meant to be imported into your code

- They expose functions, classes, objects

- How you use them

```js
import express from 'express';
const app = express();
```

### Key traits

- Used inside JS/TS files

- Installed locally in a project

- No terminal command involved

- Focused on reusable logic

- Examples
  - `express`

  - `lodash`

  - `axios`

  - `mongoose`

  - `react`

## 3️⃣ Can a package be both?

**👉 YES (very common!)**

**Example**: `eslint`

**CLI** → `eslint index.js`

**Library** → `import { ESLint } from "eslint"`

# Local Packages vs Global Packages

## 1️⃣ Local Packages

**What they are**

- Installed inside a specific project

- Available only to that project

- Stored in node_modules/

Install

```bash
npm install vite
```

- How you use them

```bash
npx vite
```

## 2️⃣ Global Packages

What they are

- Installed system-wide

- Available from any directory

- Stored in a global npm directory

- Install

```bash
npm i vite -g
```

```bash
vite
```
