# Deep Dive into Terminal Command Execution

**When you type a command into your terminal and press Enter, the shell (like Bash or Zsh) doesn't just immediately run a program. Instead, it goes through a lookup process to determine what you're asking it to do.**

## Main Types of Commands

**There are five primary types of commands the shell considers:**

## 💫 Alias:

**An alias is a shortcut or a custom name you define for a longer command or sequence of commands.** They are primarily for convenience and to customize your shell environment. For example, you might alias `ll` to `ls -alF` for a more detailed listing. Aliases are expanded by the shell before any other command lookup.

## ⚙️ Function:

**A shell function is a block of shell commands grouped together and given a name. Functions are more powerful than aliases because they can accept arguments, have local variables, and contain complex logic (like loops and conditionals).** They are often used to encapsulate more complex operations that you frequently perform.

## 🛠️ Builtin:

**Builtin commands are integral parts of the shell itself and are executed directly by the shell without invoking an external program.** They are faster and more efficient as they don't require the shell to search for an executable file on the system's PATH. Examples include `cd`, `pwd`, `echo`, `export`, and `alias`.

## ⚡️ Hash:

**The shell maintains a hash table of previously found executable commands.** When you run an external executable for the first time, the shell searches your PATH (explained below) to find it. Once found, its location is stored in the hash table. Subsequent executions of the same command will first check this hash table, leading to faster execution as the shell doesn't need to rescan the PATH.

## 🚀 Executable:

**These are external programs or scripts located in directories specified in your system's PATH environment variable.** When none of the above types match, the shell searches through the directories listed in PATH for a file with the command's name that has executable permissions. Examples include `node`, `python`, `git`, or any other application installed on your system.

## How to Check Command Type

You can use the `type` command in your terminal to determine the type of a given command:

```bash
type cd
type ll
type my_custom_function
type node
```

- `type cd` will likely output `cd is a shell builtin`.
- `type ll` might output `ll is aliased to ls -alF` (if you have that alias defined).
- `type my_custom_function` will indicate `it's a shell function`.
- `type node` will show you the path to the node executable (e.g., `node is /usr/local/bin/node` or similar).

## Command Execution Priority

**When you enter a command, the shell follows a strict order of precedence to determine which version of the command to execute:**

- ### Aliases:
  The shell first checks if the command is an alias. If it is, the alias is expanded, and the shell then processes the expanded command as if you had typed it directly.
- ### Functions:
  If no alias matches, the shell then checks if a shell function with that name exists. If it does, the function is executed.
- ### Builtins:
  Next, the shell checks for built-in commands. If the command is a builtin, it's executed directly by the shell.
- ### Hashed Commands:
  The shell then consults its hash table to see if it has previously located an executable with that name. If found, it executes that specific executable.
- ### PATH Search (Executables):
  Finally, if none of the above match, the shell searches through each directory listed in the PATH environment variable from left to right. The first executable file it finds with the given name is then executed.
