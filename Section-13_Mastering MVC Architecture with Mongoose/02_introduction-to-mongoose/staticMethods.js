/* 
statics in Mongoose

statics are used to define model methods.

A model method is a function that belongs to the Model itself, not to individual documents.

What does it mean?

When you define a static method:
the method can be called directly on the model.
Here, this refers to the User model.

When to use statics:
Use them when the logic is related to the entire collection/model, rather than a single document.
*/

import mongoose from 'mongoose';
import User from './userModel.js';

// const user = await User.findOneByName('Robert')
const user = await User.findByEmail('robert@example.com');

console.log(user);

await mongoose.disconnect();
