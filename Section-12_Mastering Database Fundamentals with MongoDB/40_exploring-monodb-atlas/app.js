import { MongoClient } from 'mongodb';

// const connectionUrl = "mongodb://anurag:anurag@127.0.0.1:27018/storageApp";
const connectionUrl =
  'mongodb+srv://khushboo30102005_db_user:a6p0XsuQJb1AapwC@cluster0.dbnsb85.mongodb.net/storageApp?appName=Cluster0';
const client = new MongoClient(connectionUrl);

await client.connect();

const db = client.db();
const collection = db.collection('users');
const data = await collection.find({ name: "Khushboo Saini" }).toArray();

console.log(data);
client.close();

