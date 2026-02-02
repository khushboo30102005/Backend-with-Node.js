console.log(module.exports === exports);

const user = {
  userName: 'Khushboo',
  Age: 22,
  address: { city: 'Baragaon' },
  hobbies: ['Coding', 'Walking'],
};
let address = user.address;
// Changes in address variable also reflect in user.address:


/* address.pinCode = 333021;
address.country = 'India';
console.log(user.address);
console.log(address);*/
console.log(user.address === address); 


address.state = "Rajsthan"
address = {
  country : 'India',
  pinCode : 333021
}
console.log(user.address);
console.log(address);