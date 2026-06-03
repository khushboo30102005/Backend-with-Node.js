const user = await User.findOne({ email: 'ankita@example.com' });
user.age = 20;
const data = await user.save();
console.log(data);


const user = await User.findOneAndUpdate(
  { email: 'ankita@example.com' },
  { age: 5 },
  { returnDocument: 'after', runValidators: true },
);
console.log(user);