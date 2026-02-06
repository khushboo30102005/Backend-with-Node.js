// const meta = import.meta
// import.meta.a = "Khushboo"
// // console.log(meta);
// const  {dirname, filename, a} = import.meta
// console.log(`DirName: ${dirname}\nFileName: ${filename}`);

// console.log(import.meta.a);
// import {num} from './math.js'
// console.log(num);

// console.log(import.meta.url);


// console.log(import.meta)
// in older versions of node.js
import { fileURLToPath } from "url";
import { dirname } from "path";
console.log(fileURLToPath(import.meta.url));
console.log(dirname(fileURLToPath(import.meta.url)));