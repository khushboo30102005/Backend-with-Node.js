# What is Shebang :

**A Shebang is that special First Line in scripts that tells the Operating System which Interpreter should run the file.**
-     Shebang = “Hey OS, run this file using THIS interpreter.”
ex:

```js
#!/usr/bin/env node
```
or

```js
#!/bin/bash
```

## What actually happens?

When we run a file like this:
```bash
./app.js
```

- The OS:

  1. Looks at the first line of the file

  2. Sees the shebang (`#!`)

  3. Uses the path after it to decide which program should execute the script

- So instead of typing:
```bash
node app.js
```

We can just run:
```bash
./app.js
```
- Shebang in Node.js (very common)
```js
#!/usr/bin/env node
console.log("Hello from Node");
```

### Why /usr/bin/env node?

- Finds node from system’s PATH

- Works across different machines & environments

- Preferred over hard-coding /usr/bin/node

### Important rules

- Must be the very first line

- Starts with `#!`

- No spaces before `#!`

- Only matters on Unix-like systems (Linux, macOS)

- Windows usually ignores it (unless via WSL / Git Bash)