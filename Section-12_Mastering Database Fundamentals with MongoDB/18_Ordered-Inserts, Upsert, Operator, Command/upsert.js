
// upsert => Update + inSert

import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

await client.connect();

const db = client.db();

const collection = db.collection('users');
const res = await collection.updateOne({name:"Bob"}, {$set: {age: 60}}, {upsert: true})
// const res = await collection.updateOne({name:"Ram"}, {$set: {age: 60}}, {upsert: true}) // if the document with name "Ram" does not exist, it will be created with the age of 30. If it does exist, the age will be updated to 30.;

console.log(res)

client.close();