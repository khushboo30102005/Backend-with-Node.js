import mongoose from 'mongoose';
import User from './userModel.js';
const user1 = await User.findOne({ email: 'khushboo@gmail.com' });
const user2 = await User.findOne({ email: 'khushboo@gmail.com' });

user1.balance += 500
await user1.save();

user2.balance += 200
await user2.save();


await mongoose.disconnect();
