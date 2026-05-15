import {MongoClient, ObjectId} from 'mongodb';


const oid1 = new ObjectId('69fde526ddf7a66ef77c6c45')
const oid2 = new ObjectId('69fde526ddf7a66ef77c6c45')
// console.log(oid1.toString() === oid2.toString())
// console.log(oid1.equals(oid2))
// console.log(oid.buffer.toString())

const oid = new ObjectId()
// console.log(ObjectId)   // [class ObjectId extends BSONValue]

// console.log(oid)   // object

console.log(ObjectId.isValid('69fde526fdf7a66ef77c6c45'))

/* const client = new MongoClient('mongodb://127.0.0.1:27017/storageApp');

await client.connect();

const db = client.db();

const collection = db.collection('users');

const data = await collection.findOne();

console.log(data);

client.close(); */
