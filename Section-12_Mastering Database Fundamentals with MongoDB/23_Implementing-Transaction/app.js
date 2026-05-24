import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://127.0.0.1:27017/');
await client.connect();
console.log('DataBase Connected!!');
const db = client.db();
const directories = db.collection('directories');
const users = db.collection('users');

const session = client.startSession();
session.startTransaction();
try {
  await directories.insertOne({ name: 'db', userName: 'a' }, { session });
  await users.insertOne({ name: 'A', rootDirName: 'db' }, { session });
  await session.commitTransaction();
} catch (error) {
  console.log(error);
  await session.abortTransaction();
}

/* await db.command(
  collMod: 'directories',
  validator: {
    $jsonSchema: {
      properties: {
        name: {
          bsonType: 'string'
        },
      },
    },
  },
});
await db.command({
  collMod: 'users',
  validator: {
    $jsonSchema: {
      properties: {
        name: {
          bsonType: 'string',
          minLength: 3,
        },
      },
    },
  },
}); */

client.close();
console.log('DataBase Disconnected!!');
