import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

await client.connect();

const db = client.db();

const collection = db.collection('users');

const res = await collection.insertMany(
  [
    {
      _id: new ObjectId('6a07e9b029af0cbd9480be27'),
      name: 'Frank',
    },
    {
      name: 'sarah',
    },
    { name: 'David' },
  ],
  { ordered: false },
); // by default, ordered is true, which means if one of the documents fails to insert, the rest of the documents will not be inserted. Setting ordered to false allows the remaining documents to be inserted even if one of them fails.

// const data = await collection.find().toArray();

console.log(res);

client.close();
