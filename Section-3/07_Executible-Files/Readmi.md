# Executable files:

 Executable files are computer files containing **binary machine code, instructions, or scripts** that an operating system directly runs to perform specific tasks or launch applications. They differ from data files by executing code rather than displaying information, with common formats including **.exe (Windows), .app (macOS), and ELF (Linux).**

## categories: 

- Executable files generally fall into two main categories based on how they are processed and executed:

  - **binary executable files and script executable files.** The key difference lies in whether the code is machine-native or requires an interpreter at runtime
  
- ## Binary Executable Files: 
  Binary executable files contain machine code instructions that the computer's CPU can execute directly. They are the result of compiling source code written in a compiled language (like C, C++, or Go) into a low-level format. **Not human-readable; appears as a sequence of binary data**.

   - Example: 

     open  nodejs using node.exe path :

     In bash: "C:\Program Files\nodejs\node.exe"
     
     In PowerShell : & "C:\Program Files\nodejs\node.exe"
- ## Script Executable Files:
  Script executable files (or scripts) contain a **sequence of instructions written in a scripting or interpreted language** (like Python, JavaScript, or Bash). These files are human-readable text files.

### Default behavior of executable files in Windows and Linux: 
  #### ✔️ In Git Bash (MINGW64) on Windows::
    all file run through terminal using there path. execute permission is not required.
  #### ✔️ In Linux / WSL::
    To run through terminal using there path file must have executable permission.

    CMD for executable permission: chmod +x filePath