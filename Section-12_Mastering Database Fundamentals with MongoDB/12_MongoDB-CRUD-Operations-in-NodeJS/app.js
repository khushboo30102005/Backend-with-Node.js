import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');

await client.connect();

// Create Operation
const db = client.db('school');
const studentsCollection = db.collection('students');
const teachersCollection = db.collection('teachers');
// const result1 = await  studentsCollection.insertMany([{name: "Khushboo", age: 23}, {name: "khushi", age:34}])
// const result2 = await teachersCollection.insertOne({name: "Anurag", age: 43})
// console.log(result1)
// console.log(result2)

// Delete Operation:
// delete collection:
// console.log(await studentsCollection.drop())
// delete document:
// console.log(await teachersCollection.deleteOne({_id:new ObjectId('69f9f3fb9e455cb02a463c52')}))
// delete field or property:
// console.log(await teachersCollection.updateOne({_id:new ObjectId('69f9f4b603ef6b7f0551c14c')},{$unset: {age: ''}}))
// delete database:
// console.log(await db.dropDatabase())

// Update Operation:
// const updateResult = await studentsCollection.updateOne({_id:new ObjectId('69f9ed4279c9b2f15c80d6d5')}, {$set: {name: "Mongo"}})
// const updateResult = await studentsCollection.updateOne({_id:new ObjectId('69f9ed4279c9b2f15c80d6d5')}, {$set: {class: 10, age: 12}})
const updateResult = await studentsCollection.replaceOne(
  { _id: new ObjectId('69f9ed4279c9b2f15c80d6d4') },
  { name: 'Express', class: 10, age: 12 },
);
console.log(updateResult);

/* 
// Read Operation :
const db = client.db('todoApp');
const collection = db.collection('todos');
// const todosData = await collection.find().toArray();
const todosData = await collection.find({ completed: true }).toArray();
console.log(todosData);
*/

client.close();
