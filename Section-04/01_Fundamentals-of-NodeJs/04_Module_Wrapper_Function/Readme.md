# 📦 module Wrapper Function :

- **Module Wrapper Function is An `Immediately Invoked Function Expression (IIFE)`.**

- **When Node.js runs a module (a `.js` file), it wraps the entire file inside this wrapper function and then executes it.**

- **Every module is wrapped independently, so each file gets its own private scope.**

- **If a module uses `require()` to load another file, that required file is also wrapped in its own module wrapper function before execution.**

- **After wrapping, the module gets access to the following parameters provided by `Node.js`:**

  - `exports`

  - `module`

  - `require`

  - `__dirname`

  - `__filename`

**Because the module code executes inside this wrapper function, all variables declared in the file remain local to that module and do not pollute the global scope.**

