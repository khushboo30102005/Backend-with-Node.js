console.time()
console.log("A file Running.....")
for (let i = 0; i <= 100000000; i++) {
  if (i % 50000000 == 0) {
    console.log("a: ",i);
  }
}
console.timeEnd()