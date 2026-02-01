console.log("B file Running.....")
for (let i = 0; i <= 100000000; i++) {
  if (i % 50000000 == 0) {
    console.log("b: ",i);
  }
}