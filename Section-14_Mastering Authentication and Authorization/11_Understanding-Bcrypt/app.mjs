import bcrypt from 'bcrypt';
// const salt = await bcrypt.genSalt(10)

const storedPassword = await bcrypt.hash('password', 12);
const index = 29;

// Manual way to password verification:

// const salt = storedPassword.slice(0, index);
// console.log([salt]);
// const hashedPassword = await bcrypt.hash('password', salt);
// console.log(storedPassword === hashedPassword);

// Method for verification:
const enteredPassword = 'password';
const isMatch = await bcrypt.compare(enteredPassword, storedPassword);
console.log({ isMatch });
