import mongoose from 'mongoose';
import User from './userModel.js';
// document middleware: save

// work with insertOne, create, and save
/* const user = await User.insertOne({
  name: 'Riya',
  age: 22,
  email: 'riya@example.com',
  hobbies: ['coding', 'singing'],
}); */

const user = new User({
  name: 'Aman',
  age: 40,
  email: 'aman@example.com',
});
await user.save()

await mongoose.disconnect();
