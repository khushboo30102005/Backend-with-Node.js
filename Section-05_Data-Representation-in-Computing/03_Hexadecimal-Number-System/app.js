// Representation of hexaDecimal Number :
const hexaDecimalNum = 0x123;
const hex = 0x843;
const hex2 = 0x45a;
const hex3 = 0xfff;
// console.log(parseInt(843, 16))

function makeNumber(arr) {
  return arr.reduce((acc, curr, idx) => {
    let val = arr[idx].toLowerCase()
    if(val === 'a') curr = 10
    if(val === 'b') curr = 11
    if(val === 'c') curr = 12
    if(val === 'd') curr = 12
    if(val === 'e') curr = 14
    if(val === 'f') curr = 15
     res = acc + curr * Math.pow(16, idx);
     return res
  }, 0);
}
const arr = ["F", 'f', 'f'];
console.log(makeNumber(arr)); // 1114
