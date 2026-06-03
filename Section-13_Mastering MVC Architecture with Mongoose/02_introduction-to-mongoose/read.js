// this way gives us a heavy document with all the methods and properties of mongoose document
const user  =await User.findOne({ email: 'ankita@example.com' });
// this way gives us a plain javascript object without any mongoose document methods and properties. 
const user  =await User.findOne({ email: 'ankita@example.com' }).lean();


// How to get all the documents from the collection
const user  = await User.find()  //this will return an array of documents

const user  = await User.find().cursor(); //this will convert that array into cursor and we can use toArray() method to convert that cursor into an array of documents
const user  = await User.find().cursor().toArray(); //this will return an array of documents 

const user  = await User.find().lean();  // lean()