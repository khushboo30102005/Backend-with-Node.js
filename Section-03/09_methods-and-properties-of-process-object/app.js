
// console.log(process.argv);
// const argv = process.argv.slice(2)
// console.log(argv);

// console.log("Before:", process.cwd());

// process.chdir("./tmp");

// console.log("After:", process.cwd());

const fs = require('fs');
const path = require('path');

process.chdir('./tmp')

// current working directory
const currentDir = process.cwd();

fs.readdir(currentDir, (err, items) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  items.forEach(item => {
    console.log(item);
  });
});
