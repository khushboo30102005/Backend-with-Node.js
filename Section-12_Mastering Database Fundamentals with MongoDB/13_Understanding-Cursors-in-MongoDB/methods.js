import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://127.0.0.1:27017/');
await client.connect();
const db = client.db('expenseApp');
const collection = db.collection('expenses');
const cursor = collection
  .find()
  .skip(0)
  .limit(0)
  .sort({ amount: 1, title: 1 })
  .filter({ title: 'Taxi ride' })
  .map(({ title, amount }) => ({
    title,
    amount,
  })); // -1 for desc order
const data = await cursor.toArray();
console.log(data);
client.close();
