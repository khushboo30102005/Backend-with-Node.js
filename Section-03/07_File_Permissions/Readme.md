# File Permissions : (Linux/Unix) 
  File Permissions are **Security Rules** that controls which user can **read, write and executes** the files and directories. They are divided into three types -- **1. Read, 2. Write, 3. Execute**. Assign to three Category **1. User, 2. Owner, 3. Others.** Permission are modified using `chmod` command.

## Key Component of File Permission:
  - #### Permission types:
    - Read (r) : Allows **Opening and viewing** file contents or listing directory files.
    - Write (w): Allows **modifying files or creating/deleting** files within a directory.
    - Execute (x): Allows **running a file as a program or script**, or accessing/entering a directory.
  - User Classes:
    - User (u): The owner of the file.
    - Group (g): Users in the file's group.
    - Others (o): Everyone else.
    - All (a): All of the above. 
  
### Managing Permissions with chmod

#### Permissions can be set using numeric (octal) or symbolic modes: 
 - Numeric Mode (e.g. (755)): Three digits represent Owner, Group, and Others.
   - 4 = read
   - 1 = execute 
   - 2 = write
   - Example: chmod 755 file (Owner: \(rwx\), Group: \(r-x\), Others: \(r-x\)).

  - Symbolic Mode (e.g., \(u+x\)): Uses letters to add (\(+\)), remove (\(-\)), or set (\(=\)) permissions.
    - Example: chmod u+x file (Adds execute permission for the user). 

  - Common Examples:
    - `777 (rwxrwxrwx)`: Full access for everyone (dangerous, avoid).
    - `755 (rwxr-xr-x):` Owner can do anything; others can only read and execute (common for scripts/directories).
    - `644 (rw-r--r--)`: Owner can read/write; others can only read (standard file). 
        - Ex: `stat -c "%A %a %n" app.js`

        - OutPut: `-rw-r--r-- 644 app.js`
        - Ex: `chmod 755 cmd.sh`

        - OutPut: `-rwxr-xr-x 755 cmd.sh`

  - Other Commands: 
    - chown: Changes the owner of a file.
    - chgrp: Changes the group ownership of a file.
    - ls -l: Lists files with their permissions (e.g., `-rwxr-xr-x`). 

## 📌 Git File Modes:

Git does not track full Linux permissions.
It tracks only whether a file is executable or not, plus file type.

### 🔹 Git File Modes

| Mode       | Type          | Description                                            |
|------------|---------------|--------------------------------------------------------|
| **100644** | Regular file  | Non-executable file (default for source code, configs) |
| **100755** | Regular file  | Executable file (scripts, CLI tools)                   |
| **040000** | Directory     | Directory (stored as a tree object in Git)             |
| **120000** | Symbolic link | Symlink (Git stores link target, not permissions)      |

### 🔹 Important Notes

  - Git tracks only the execute (x) bit for files

  - Read/write permissions are ignored

  - Any non-executable file → 100644

  - Any executable file → 100755

  - Directory permissions are not tracked

  - Symlink permissions are ignored


### 🔧 Important Git Commands (File Modes)
 - Check file permission change in Git
   ```
   git diff
   ```

 - Summary of permission change
   ```
   git diff --summary
   ```


 - Example output:
   ```
   old mode 100644
   new mode 100755
   ```


### 🧠 Key Takeaway

Git only cares if a file is executable or not.
All other permission changes are ignored.