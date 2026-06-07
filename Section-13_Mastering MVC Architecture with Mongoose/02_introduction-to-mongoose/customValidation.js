import mongoose from "mongoose";
import User from "./userModel.js";

const user = await User.create({
  name: 'karina',
  age: 46,
  email: 'karina@example.com'
})

console.log(user)