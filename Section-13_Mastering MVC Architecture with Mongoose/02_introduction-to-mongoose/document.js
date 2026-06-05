import mongoose from "mongoose";
import User from "./userModel.js";

const user = new User()  // it creates a new instance of the User model, which is a Mongoose document. The user variable now holds a new document that has not yet been saved to the database. You can set properties on this document and then call save() to persist it to the database.

// console.log(user.isNew) // true, because the document has not been saved to the database yet.

console.log(user instanceof mongoose.Document) // true, because the user variable is an instance of a Mongoose document. This means that it has all the properties and methods of a Mongoose document, such as save(), validate(), etc.

console.log(user.isModified()) // false, because we have not made any changes to the document yet. isModified() is a method that checks if any fields in the document have been modified since it was last saved to the database. Since we have not set any properties on the user document, it is not considered modified.

user.age = 25; // this will set the age property of the user document to 25. Now the document is considered modified because we have changed one of its properties.

console.log(user.isModified()) // true, because we have modified the age property of the user document. Now it is considered modified since we have made changes to it.



// console.log(user)