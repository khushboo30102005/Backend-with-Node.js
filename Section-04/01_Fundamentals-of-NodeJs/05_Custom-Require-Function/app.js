const b = loadModule('./math.js');
const { product } = loadModule('./product.js');

/* "use strict"
const vm = require('vm');
const a = 5
vm.runInNewContext('console.log(a)', {a})
vm.runInThisContext('console.log(a)')
eval('var a = 5') //eval is getting ignore in strict mode */


// console.log(b);
console.log(product(1, 2, 3, 4));
function loadModule(path) {
  const fs = require('fs');
  const vm = require('vm');
  const fileContent = fs.readFileSync(path).toString();
  return (function (send) {
    // eval(fileContent);
    vm.runInNewContext(fileContent, {send, loadModule, console})
    return send;
  })({});
}
