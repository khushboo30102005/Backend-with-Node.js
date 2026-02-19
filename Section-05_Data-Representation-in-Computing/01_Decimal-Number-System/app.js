function makeNumber(arr) {
  return arr.reduce((acc, curr, idx) => acc + curr * Math.pow(10, idx), 0);
}
const arr = [2, 4, 6, 5]; 
console.log(makeNumber(arr));  // 5642


