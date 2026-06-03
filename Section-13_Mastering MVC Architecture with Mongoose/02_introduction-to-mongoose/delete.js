const user = await User.findOneAndDelete(
  { email: 'ankita@example.com' },
  { returnDocument: 'after' },
);
console.log(user);