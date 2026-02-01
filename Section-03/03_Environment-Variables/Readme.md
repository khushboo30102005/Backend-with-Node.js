# Environment Variables 

**An environment variable is a named value, like API_KEY=12345, that stores configuration data or system information, affecting how programs and applications run on an operating system They act as key-value pairs, providing settings for paths (like PATH), user directories (HOME), or application-specific details (like database credentials), allowing flexible configuration without changing code.**


# Types:
### 1. System Variables : *system specific variables*
### 2. User Variables: *User Specific variables*
### 3. Process Variables : *Process Specific variables*



### command for debug mode :
**node --inspect app.js**

## Create an Environment Variable :
**export num=45**

Write it in  .bashrc file for permanent Access.

---
### Check VSCode run as admin or not:

***net session >/dev/null 2>&1 && echo "ADMIN" || echo "NOT ADMIN"***

# Setting and Using Env Variables :

- Write in Terminal : 
  **env** or 
  **printenv** to see environment variables in terminal.

- Create a variable in user Variable in env variables :
  **setx MY_USER_VAR "hello_world"** CMD for set new variable. 
 **setx MY_USER_VAR ""** CMD for set empty value in variable.

- Delete Variable: **powershell.exe -Command "REG DELETE HKCU\Environment /V MY_USER_VAR /F"** this is a powershell command for delete a ENV variable.

*example:*

  Create a ENV variable:

  setx Demo_var "hello" 

  Delete this variable:

  powershell -Command "REG delete HKCU\Environment /V Demo_var /F"

---
## How to update System Environment variables :

**powershell -Command "setx Demo_var "kk" /M"**

For running this command, First Launch Git Bash as Administrator and run this command in bash terminal.

*Example:*

Create a new System Environment Variable :

**powershell -Command "setx Demo_var "kk" /M"**

SUCCESS: Specified value was saved.

Update this variable:

**powershell -Command "setx Demo_var2 'khushboo saini' /M"**

SUCCESS: Specified value was saved.


---
### Another / Different Way to Debugging :
write some code that take some time during execution like setInterval and write in terminal **node --inspect app.js** open *chrome* (*example.com* etc.) > *inspect* > click on **node** icon. Now open a dedicative   *Chrome dev tool* for *Node.js* and then we can debugging in Chrome dev tool(**debug**).

---
### How to create env variables in directly in child Processes (temporarily):
write **N1=55 node --inspect app.js** for creating new env variable (process specific variable). This env variable is directly assign to *child Process* instead of Inherit from *parent Process*.

Write **name="Khushboo" age=21 node --inspect app.js** Command for create multiple env variable in child process.

Write **env -u num node --inspect app.js** to delete env variable in child process.

**Child Process does not change Parent Process env variables.** using these commands.

---
## Practical use of env variables :
We store our Env variables in *.env* file and with help of *fs module* we read this file and store in a variable. Using *process.env* we create ENV variables in process.

---

## CRLF AND LF :
**CRLF *(\r\n)* and LF *(\n)* are special, invisible characters** that define the *end of a line in a text file*. The primary difference is the operating system (OS) convention: **Windows uses *CRLF (Carriage Return + Line Feed)*, while Linux and macOS use *LF (Line Feed*)**. Mixed line endings can cause coding issues, particularly in Git. 