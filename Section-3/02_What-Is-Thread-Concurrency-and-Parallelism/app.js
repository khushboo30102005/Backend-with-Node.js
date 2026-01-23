
const {Worker} = require('worker_threads');

new Worker("./a");
new Worker("./b"); 
new Worker("./c");

// console.time()
// console.log("A file Running.....")
// for (let i = 0; i <= 100000000; i++) {
//   if (i % 50000000 == 0) {
//     console.log(i);
//   }
// }
// console.log("B file Running.....")
// for (let i = 0; i <= 100000000; i++) {
//   if (i % 50000000 == 0) {
//     console.log(i);
//   }
// }
// console.log("C file Running.....")
// for (let i = 0; i <= 100000000; i++) {
//   if (i % 50000000 == 0) {
//     console.log(i);
//   }
// }
// console.timeEnd()