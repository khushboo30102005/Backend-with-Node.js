import mongoose from 'mongoose';
import User from './userModel.js';
// Model middleware: find

const result = await User.insertMany([
  {
    name: 'Aman',
    age: 40,
    email: 'aman@example.com',
  },
  {
    name: 'Raman',
    age: 30,
    email: 'aman@example.com',
  },
]);

await mongoose.disconnect();
