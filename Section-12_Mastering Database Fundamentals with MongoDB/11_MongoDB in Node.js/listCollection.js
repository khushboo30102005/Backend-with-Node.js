import {MongoClient} from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');

await  client.connect();

const db = client.db('admin')

// console.log(db)
// console.log(db.namespace)
// console.log(db.databaseName)
console.log(await db.listCollections().toArray())

// const collection = db.collection('expenses');
// console.log(await collection.find().toArray())