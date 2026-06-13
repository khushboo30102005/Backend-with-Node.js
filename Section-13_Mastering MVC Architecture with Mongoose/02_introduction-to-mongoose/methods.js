/* methods in Mongoose

methods are used to define instance methods on Mongoose documents.

An instance method is a function that becomes available on every document created from a model.

What does it mean?

If you define a method on a schema, every document of that model can call that method.
 */
import mongoose from 'mongoose';
import User from './userModel.js';

const user = await User.findOne({ email: 'Robert@example.com' });
console.log(user.getSummary())
console.log(user.getSummary('full'))


await mongoose.disconnect();
