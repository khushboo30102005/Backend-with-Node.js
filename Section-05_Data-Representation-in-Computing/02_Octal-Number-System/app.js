// Representation of Octal Number System
const a = 0o4521;
// console.log(a)  //2385

// convert a octal number into decimal number :

const num = parseInt(4521, 8);
// console.log(num)   //2385

// Convert a decimal number into Octal Number :

const num2 = 173;
const num2InOctal = num2.toString(8);
console.log(num2InOctal);

// Function that take a digits arr and return a number according to given radix = 8:
function makeNumber(arr) {
  return arr.reduce((acc, curr, idx) => acc + curr * Math.pow(8, idx), 0);
}
const arr = [2, 4, 6, 5];
// console.log(makeNumber(arr));  // 2978

// function that take a Decimal number (integers) and convert it into octal number (behave like toString(8) methods)

function decimalToOctal(num) {
  if (num === 0) return '0';
  let res = '';
  const isNegative = num < 0;
  num = Math.abs(num);
  let dividend = num;
  const divisor = 8;

  while (dividend > 0) {
    res = (dividend % divisor) + res;
    dividend = Math.floor(dividend / divisor);
  }
  return isNegative ? '-' + res : res;
}
console.log(decimalToOctal(173)); // 255
