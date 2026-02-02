function sum(...nums) {
  return nums.reduce((acc, curr) => curr + acc);
}

function product(...nums) {
  return nums.reduce((acc, curr) => curr * acc);
}


// console.log(module.exports);
module.exports.sum = sum
// exports.sum = sum
module.exports.product = product
// exports.product = product

// exports = {sum, product};

// console.log(module.exports);