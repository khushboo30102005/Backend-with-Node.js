const fs = require("fs")
const text = fs.readFileSync("C:\\Users\\T14\\Desktop\\hello.txt")
console.log(text.toString());
console.log(global);
console.log("END");