import mongoose from 'mongoose';
import User from './userModel.js';

const user = await User.findOne({ email: 'Robert@example.com' });

// console.log(user.nam);

// console.log(user.isAdult)
// console.log(User.schema.virtuals)
// user.getHobbies = 'TT, Football'
// console.log(user.getHobbies)
// await user.save()
// console.log(user.toJSON({ virtuals: true }));
// console.log(user.toJSON());
console.log(user.toObject());

console.log(user.emailDomain)

await mongoose.disconnect();
