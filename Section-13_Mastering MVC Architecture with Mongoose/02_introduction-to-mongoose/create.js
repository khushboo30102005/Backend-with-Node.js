import User from "./userModel.js";

const data = await User.insertOne({
  name: 'Ashish',
  age: 14,
  email: 'Ashish@example.com',
  parentId: '6a1ff2d764fd94973ca0b733',
  hobbies: ['cricket', 'football']
  
});
const data = await User.create({
  name: 'Amit',
  age: 14,
  email: 'Amit@example.com',
  parentId: '6a1ff2d764fd94973ca0b733',
  hobbies: ['cricket', 'football']
  
});
console.log(data);
const data = await User.create([{
  name: 'Ram',
  age: 14,
  email: 'Ram@example.com',
  parentId: '6a1ff2d764fd94973ca0b733',
  hobbies: ['cricket', 'football']
  
},
{
  name: 'Shyam',
  age: 14,
  email: 'Shyam@example.com',
  parentId: '6a1ff2d764fd94973ca0b733',
  hobbies: ['TT', 'Kabbadi']
}]);
console.log(data);


// when we use new keyword to create an instance of the model, it creates a document in memory. We can modify the document and then save it to the database using the save() method. This is useful when we want to perform some operations on the document before saving it to the database.
const user = new User({
  name: 'lina',
  age: 14,
  email: 'lina@example.com',
  parentId: '6a1ff2d764fd94973ca0b733',
  hobbies: ['cricket', 'football']
});
user.age = 20
user.hobbies.push('TT');
const data = await user.save();
console.log(data);
