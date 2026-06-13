import mongoose from 'mongoose';
import User from './userModel.js';
// Query middleware: find

const user = await User.find({
  name: 'Aman',
});
console.log(user)
const user2 = await User.findOne({
  name: 'Aman',
});
console.log(user2)
await mongoose.disconnect();
