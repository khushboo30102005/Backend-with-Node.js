# num1=5  # create variable num1 with value 5
# num2=10
# echo $((num1 + num2))  # console log using echo cmd
# echo End

# pwd  # print working directory

# whoami  # print current user

# cd    # change directory 

# cd ../  # change directory to parent directory

# cd ../Section-1 # change directory to Section-1 folder

# cd ~/ # change directory to home directory

# ls # listing Directory contents

# ls -a  # listing all files including hidden files

# ls -la # listing all files in long format including hidden files

# touch testfile.txt  # create an empty file named testfile.txt

# touch index.html script.js style.css  # create multiple files

# mkdir src  # create a directory named src

# mkdir assets images styles scripts  # create multiple directories

# cp app.js scripts   # copy app.js file to scripts directory

# mv styles.css src  # move styles.css file to src directory

# mv app.js src  # move app.js file to src directory

# mv test.txt "C:\Users\T14\Desktop" # move test.txt file to Desktop

# mv script.js server.js # rename script.js to server.js

# mv server.js "C:\Users\T14\Desktop/index.js" # move and rename server.js to index.js on Desktop

# rm index.js  # delete index.js file

# rmdir assets  # delete assets directory only if it's empty

# rm -r src  # delete src directory and its contents recursively here r flags are used for recursive deletion

# rm -r images  # delete images directory , it is empty here

# for i in {1..100}; do touch app$i.js; done  # create 100 files named app1.js to app100.js

# for i in {1..100}; do rm app$i.js; done  # delete 100 files named app1.js to app100.js


# # Viewing and Editing Files with Commands (cat, nano, vim) --> 

# cat app.js  # display contents of app.js file

# nano app.js  # open app.js file in nano text editor

# vim app.js  # open app.js file in vim text editor
# # Note: To exit vim, press 'Esc', type ':q!' and hit 'Enter' to quit without saving changes.  
# # To save changes and exit, press 'Esc', type ':wq' and hit 'Enter'.

# What Is Prompt in Terminal?
# The prompt in a terminal is a symbol or set of characters that indicates the terminal is ready to accept commands.
# It often includes information such as the current user, hostname, and working directory.

# echo $PS1  # display the current prompt string
# echo $PS2  # display the secondary prompt string
# You can customize the prompt by modifying the PS1 variable.
# PS1=Khushboo  # set a custom prompt
# echo $PS1  # display the updated prompt string 

#PS2 is used for multi-line commands.
# PS2="--> "  # set a custom secondary prompt


#Configuring Our Terminal Using .bashrc File
# The .bashrc file is a script that runs whenever a new terminal session is started in interactive mode.

# first, go to home directory
# cd ~
# explore . # open home directory in file explorer

# create the .bashrc file if it doesn't exist
# touch .bashrc # rc stands for "run commands"

# write some commands in .bashrc file to be executed whenever a new terminal session starts
# when you open a new terminal, the commands in .bashrc will run automatically.
# and variables defined in .bashrc will be available in that terminal session.

# when new terminal session starts, it will run the commands in .bashrc file and display "Running .bashrc file" message. and also running .bash_profile file when terminal starts. At first .bash_profile will run and then it will run .bashrc file because in .bash_profile we have written command to run .bashrc file.

# customize command prompt to show current directory and git branch in different colors

# avoid new terminal for running .bashrc again and again , we run source .bashrc or . ~/.bashrc command to apply changes made in .bashrc file to current terminal session

# source ~/.bashrc  # source the .bashrc file to apply changes to current terminal session

#code ~/.bashrc # Open this file into editor

# Using Aliases for Command Shortcuts (alias)
# An alias is a shortcut that allows you to create a custom command that represents a longer command or series of commands.
# Aliases are typically defined in the .bashrc file so that they are available in every terminal session.
