# File System :
- #### Folder or Directory : Directories are a **Container** that organizes other folders/directories and files.

- #### Files : A file is **basic unit data storage**. Files are contain some data.

- #### Symbolic Link : A Symbolic Link (SymLink) is type of file that *serves as a pointer or alias* to another file or directory, allowing access to the target without duplicating data. This is not directly visible in File Explorer but available in terminal. In another words *"A file that contains a reference (a path) to another file or directory."*

### How to identify File | Directory | Symlink :
#### When Open in terminal:  (***ls -l***)
* File : Start From **'-'**.
* Directory : Start From **'d'**.
* Symbolic Link : Start From **'l**'.

# Path System :
The Windows Path system defines how the operating system locates files and directories, utilizing a backslash (\\) as a delimiter and often starting with a drive letter (e.g., C:\Program Files). It includes both specific file paths and the system PATH environment variable, which enables users to run executables from any directory by listing essential system directories. 

### Key Aspects of the Windows Path System:
- Structure: Paths are hierarchical (e.g., C:\Users\Name\Documents\File.txt).
- Path Types:
  - **Absolute Path:** The complete address from the root, starting with a drive letter, such as C:\Windows\System32.
  - **Relative Path:** The location relative to the current working directory.


Working directory -> /c/Users/T14/Desktop/Backend-with-Node.js/Section-3/05_File_System

this is not  windows Compatible path convention. To convert this windows compatible path system use ***cygpath -w*** command.

example:

- Unix into Windows:
  - ***cygpath -w /c/Users/T14/Desktop/Backend-with-Node.js/Section-3/05_File_System***

  - output: ***C:\Users\T14\Desktop\Backend-with-Node.js\Section-3\05_File_System***

  - Now we can open in file explorer using ***explorer "C:\Users\T14\Desktop\Backend-with-Node.js\Section-3\05_File_System"*** command.
 
- Windows into Unix :

  - example: ***cygpath -u C:\Users\T14\Desktop\Backend-with-Node.js\Section-3\05_File_System***

  - output: ***/c/Users/T14/Desktop/Backend-with-Node.js/Section-3/05_File_System***

## some commands :
- cd . : Go to Current directory or file.
- cd .. or cd ../ : Go to parent directory or file.
- cd ~ or cd ~/: Go to Home Directory.
- cat ~/.bashrc : read bashrc file. (read any file using ***cat*** cmd.)
- cd / : GO to Root directory.