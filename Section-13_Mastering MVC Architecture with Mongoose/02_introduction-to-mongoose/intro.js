import mongoose from 'mongoose';

await mongoose.connect('mongodb://admin:admin@localhost')

console.log('database connected!!!')
// Pluralization is enabled by default in Mongoose. You can disable it or customize it as needed.
// const pluralizer = mongoose.pluralize()
// mongoose.pluralize((word) => pluralizer(word.toLocaleLowerCase()) + '_col')

//  first parameter is model name, second parameter is schema, and third parameter is collection name that we want to use in database. If we don't provide third parameter then mongoose will pluralize the model name and use it as collection name.

// mongoose.model('Cat', {}, 'dog')

mongoose.set('autoCreate', false);
const UserModel = mongoose.model('User', {name: String, age: Number});

const data = await UserModel.insertOne({name: 'bc', age: 'abc'})

console.log(data)