import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://127.0.0.1:27017/');
await client.connect();
const db = client.db('todoApp');
const collection = db.collection('todos');
const cursor = await collection.find().batchSize(100);
const data = await cursor.toArray();
console.log(data.map(({ title, completed }) => ({ title, completed })));
client.close();
