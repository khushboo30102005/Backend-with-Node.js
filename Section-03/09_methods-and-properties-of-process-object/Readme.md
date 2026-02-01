# Methods and Properties of Process Object:

## 1. process.argv :

### What is it :

`process.argv` is a Property of process object in `nodejs` that stores an array of command-Line arguments passed when a node.js program run.

`process` : Global object in node.js representing the **current node.js process**.

`argv`: stand for **Argument Value**

**So, process.argv lets program know what parameters were given when it was started.**

### How it works (Structure of the Array)

- When run :

```bash
node app.js firstArg secondArg
```

- `process.argv` will look like this:

```js
[
  'C:\\Program Files\\nodejs\\node.exe', // 0 → Path to Node.js executable
  'C:\\Users\\T14\\Desktop\\Backend-with-Node.js\\Section-03\\09_methods-and-properties-of-process-object\\app.js', // 1 → Path to your script
  'firstArg', // 2 → First argument passed
  'secondArg', // 3 → Second argument passed
];
```

- ✅ **Important: The first two elements are always Node executable path and script path. The actual arguments start from index 2**.

- Example Usages:

```js
console.log(process.argv);
const argv = process.argv.slice(2);
console.log(argv);
```

```bash
node app.js firstArg secondArg
```

```bash
[
  'C:\\Program Files\\nodejs\\node.exe',
  'C:\\Users\\T14\\Desktop\\Backend-with-Node.js\\Section-03\\09_methods-and-properties-of-process-object\\app.js',
  'firstArg',
  'secondArg'
]
[ 'firstArg', 'secondArg' ]

```

---

## 2. process.env

`process.env` is a property of the process object in Node.js that contains **all environment variables available to the current process**.

- It is an object, not an array.

- Keys and values are strings.

- These variables come from the OS environment (Windows / Linux / macOS).

```
process.env
```

➡️ Gives access to system-level configuration values.

- ### What are Environment Variables?

Environment variables are key–value pairs used to store:

- Configuration settings

- Secrets (API keys, passwords)

- Environment info (PORT, MODE, PATH)

- ### Accessing an environment variable

```js
console.log(process.env.PATH);
```

Example (Node):

```js
console.log(process.env.USERNAME);
console.log(process.env.HOME);
```

If the variable does not exist:

```js
console.log(process.env.MY_VAR); // undefined
```

---

## 3. process.pid :

- ### What is `process.pid`?

`process.pid` is a property of the process object in Node.js that returns the **Process ID (PID) of the currently running Node.js process**.

- PID = unique number

- Assigned by the operating system

- Helps OS identify and manage the process

```js
process.pid;
```

- ### What is a Process ID (PID)?

A PID is a unique identifier given to every running process by the OS.

Example:

- Chrome → one PID

- Node.js app → another PID

- Each terminal command → separate PID

- Example in Node.js

```js
console.log(process.pid);
```

---

## 4. process.ppid;

- ### What is process.ppid?

`process.ppid` is a property of the process object in Node.js that returns **the Parent Process ID (PPID) of the current Node.js process.**

- PPID = Process ID of the process that started this process

- Assigned by the operating system

- It tells who launched the current process

```js
process.ppid;
```

---

## 5. process.platform

- ### What is process.platform?

`process.platform` is a property of the process object in Node.js that returns a string that identifies the operating system on which the Node.js process is running.

```js
process.platform; // 'win32'
```

- ### What kind of value does it return?

It returns a **short OS identifier**, not the full OS name.

- Example:

```js
if (process.platform === 'win32') {
  console.log('Running on Windows');
} else {
  console.log('Running on Linux or macOS');
}
```

---

## 6. process.version

- ### What is process.version?

`process.version` is a property of the process object that returns the **current Node.js version as a string.**

```js
process.version;
```

- ### Example

```js
console.log(process.version);
```

Output:

```bash
'v22.20.0'
```

(Version will vary on your system)

- ### Key points
  - Returns a string

  - Prefixed with v

  - Represents only Node.js version

---

## 7. process.versions

- ### What is process.versions?

`process.versions` is a property of the process object that returns an **object containing version information of Node.js and its internal dependencies.**

```js
process.versions;
```

- ### Example

```js
console.log(process.versions);
```

Sample output :

```bash
{
  node: '20.11.1',
  v8: '11.3.244.8-node.17',
  uv: '1.48.0',
  zlib: '1.3',
  brotli: '1.1.0',
  openssl: '3.0.13'
}
```

- ### What does it include?
  - node → Node.js version

  - v8 → JavaScript engine

  - uv → libuv (event loop)

  - openssl → security / crypto

  - zlib, brotli → compression

---

## 8. process.arch

- ### What is process.arch?

process.arch is a property of the process object in Node.js that returns a string identifying the **CPU architecture on which the Node.js process is running.**

```js
process.arch;
```

- ### Example

```js
console.log(process.arch);
```

Output examples:

```js
x64; // Most modern PCs
arm64; // Apple Silicon, some servers
```

---

## 9. process.cwd()

- ### What is process.cwd()?

`process.cwd()` is a method of the process object in Node.js that returns the **current working directory of the Node.js process.**

```js
process.cwd();
```

OutPut:

```js
'C:\\Users\\T14\\Desktop\\Backend-with-Node.js\\Section-03\\09_methods-and-properties-of-process-object';
```

- `cwd` = **Current Working Directory**

- It tells from where the Node.js process was started.

---

## 10. process.chdir()

- ### What is process.chdir()?

`process.chdir()` is a method of the process object in Node.js that **changes the current working directory of the running process**.

```js
process.chdir(path);
```

- `path` → new directory path

- Affects only the current Node.js process

- ### Example

```js
console.log('Before:', process.cwd());

process.chdir('./tmp');

console.log('After:', process.cwd());
```

output:

```bash
Before: C:\Users\T14\Desktop\Backend-with-Node.js\Section-03\09_methods-and-properties-of-process-object
After: C:\Users\T14\Desktop\Backend-with-Node.js\Section-03\09_methods-and-properties-of-process-object\tmp
```

---

## 11. process.memoryUsage()

- ### What is process.memoryUsage()?

`process.memoryUsage()` is a method that returns an **object describing memory usage of the current Node.js process**.

- ### Example:

```js
process.memoryUsage();
```

OutPut:

```js
{
  rss: 51224576,
  heapTotal: 21573632,
  heapUsed: 17894560,
  external: 1342177,
  arrayBuffers: 989234
}
```

- ### Meaning of fields:
  - rss → Total memory allocated (RAM)

  - heapTotal → Total heap memory

  - heapUsed → Used heap memory

  - external → Memory used by C++ objects

  - arrayBuffers → Memory for binary data

  📌 Values are in bytes.

  **`process.memoryUsage()` returns an object containing memory usage details of the current process.**

---

## 12. process.uptime()

`process.uptime()` is a method that returns **The time (in seconds) the current Node.js process has been running.**

```js
process.uptime();
```

- ### Example

```js
console.log(process.uptime());
```

Output:

```js
12.532;
```

- ### Key points
  - Returns a number

  - Unit → seconds

  - Useful for monitoring & logging

**`process.uptime()` returns the time in seconds for which the Node.js process has been running.**

---

## 13. process.exit(0)

- ### What does process.exit(0) do?

`process.exit(0)` immediately **terminates the Node.js process** and tells the operating system that the program finished successfully.

```js
process.exit(0);
```

- ### Meaning of 0

`0` → Success / Normal termination

`Any non-zero value` → Error / Abnormal termination

Examples:

```js
process.exit(1); // general error
process.exit(2); // custom error
```

```js
console.log('Before exit');
process.exit(0);
console.log('After exit'); // ❌ never runs
```

Output:

```bash
Before exit
```

- ### Important behavior ⚠️
  - Stops execution immediately

  - Async operations are not completed

  - Open timers, promises, file writes may be skipped

```js
setTimeout(() => {
  console.log('This will not run');
}, 1000);

process.exit(0);
```

**`process.exit(0)` terminates the Node.js process immediately with a success exit code.**

---

## 14. process.kill(process.pid)

- ### What is process.kill()?

`process.kill()` sends a signal to a process (usually to terminate it).

```js
process.kill(pid, signal);
```

- ### Example

```js
process.kill(process.pid);
```

#### ➡️ Kills the current process.

With signal:

```js
process.kill(process.pid, 'SIGTERM');
```

- ### Important clarification ⚠️

- Despite the name:
  - process.kill() does not always kill

  - It sends a signal

  - Default signal → SIGTERM

**`process.kill()` sends a signal to a process identified by its PID**.

---

## 15. process.emitWarning()

**process.emitWarning("This is a custom warning message!", {
code: "MY_WARNING_CODE",
detail: "This is some additional warning detail.",
});**

- ### What is process.emitWarning()?

`process.emitWarning()` is a Node.js process method used to **emit (generate) a warning** from your application without crashing the process.

```javascript
process.emitWarning(message, options);
```

- It prints a warning message

- Execution continues normally

- Useful for deprecations, non-fatal issues, or developer notices
```js
process.emitWarning("This is a custom warning message!", {
  code: "MY_WARNING_CODE",
  detail: "This is some additional warning detail.",
});
```
What happens:

    `"This is a custom warning message!"` → main warning text

    `code` → custom warning identifier

    `detail` → extra explanation shown in stack trace

- ###  Sample output
```bash
(node:14532) [MY_WARNING_CODE] Warning: This is a custom warning message!
This is some additional warning detail.
```

⚠️ The process does NOT exit.

---

## 16. process.stdin, process.stdout & process.stderr

- ### What are `stdin, stdout, and stderr`?

They are standard streams used by a process to **communicate with the outside world**.
| Stream | Purpose          | Direction |
|--------|------------------|-----------|
| stdin  | Input (keyboard) | Read      |
| stdout | Normal output    | Write     |
| stderr | Error output     | Write     |

`process.stdout.write()`
- ### What does it do?

**Writes data directly to the standard output stream.**
```js
process.stdout.write("Hello, stdout!\n");
```

✔️ Prints text to terminal

✔️ Does not automatically add a newline

✔️ Faster & more low-level than console.log()

`process.stderr.write()`
- ### What does it do?

**Writes data directly to the standard error stream.**
```js
process.stderr.write("Hello, stderr!\n");
```

✔️ Used for error messages

✔️ Separate from normal output

✔️ Useful for logging & debugging