const myObj = {
  then(resolve) {
    h1.addEventListener('click', () => {
      resolve('resolve function called');
    });
  },
};

myObj.then((data) => {
  console.log(data);
});


console.log(await myObj);
console.log(await myObj);
console.log(await myObj);
console.log(await myObj);
