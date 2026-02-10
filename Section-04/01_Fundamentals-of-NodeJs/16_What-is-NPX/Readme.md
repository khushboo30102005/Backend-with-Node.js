# What is NPX :

NPX stands for `Node Package eXecute`.

in simple words **npx is a tool that executes node.js packages without needing to install them globally .**

## What exactly is `npx` ?

- `npx` comes bundled with npm (v5.2+).
- It locates and executes `JavaScript` based cli tools.
- It run the **`js` file exposed via bin** filed of the package.

**👉 npx ultimately runs JavaScript files**

### Where npx install packages:

**_npx DOES install packages_**,
but not:

**in your project (node_modules)**

**not globally (npm -g)**

**👉 Instead, it installs them into a temporary execution directory:**

```bash
C:\Users\<username>\AppData\Local\npm-cache\_npx
```

## what is difference between npm and npx :

The fundamental difference is that `npm is a package manager for installing and managing dependencies, while npx is package runner used to execute packages.`

#### What npm really does

npm = `Node Package Manager`

- Primary job:

  📦 download packages

  📌 register them as dependencies

  🗂️ manage versions & updates

- Examples

- Local install

```bash
  npm install lodash
```
Creates:
```
node_modules/
package.json
package-lock.json
```
- Global install
```bash
npm install -g nodemon
```
Installs here:
```
C:\Users\<username>\AppData\Roaming\npm\node_modules
```

### What npx really does

npx = `Node Package eXecute`

- Primary job:

  ▶️ run CLI tools
 
  🚫 without permanent installation

  