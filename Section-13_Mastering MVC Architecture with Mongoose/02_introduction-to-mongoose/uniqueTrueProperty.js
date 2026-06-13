import mongoose from 'mongoose';
import User from './userModel.js';
await User.init()  // this method ensure the model's indexes are created.
// const user  = await User.insertOne({
//   name: 'Khushboo',
//   age: 20,
//   email: 'khushboo@gmail.com',
// });

// console.log(user);

await mongoose.disconnect();
