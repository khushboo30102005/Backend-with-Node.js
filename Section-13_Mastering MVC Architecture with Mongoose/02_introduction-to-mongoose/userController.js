import mongoose from 'mongoose';
import User from './userModel.js';

const user = await User.findOne({ email: 'alice@example.com' }).populate({
  path: 'parentId',
  select: "name age email -_id"
});
console.log(user)