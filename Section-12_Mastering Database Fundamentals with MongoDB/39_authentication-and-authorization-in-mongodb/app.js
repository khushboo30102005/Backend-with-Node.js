import { MongoClient } from "mongodb";

// const connectionUrl = "mongodb://khushboo:khushboo@127.0.0.1:27018/storageApp";
const connectionUrl =
  "mongodb://anurag:anurag@127.0.0.1:27018/storageApp?authSource=admin";
  
const client = new MongoClient(connectionUrl);

await client.connect();

const db = client.db();
const collection = db.collection("users");
const data = await collection.find().toArray();

console.log(data);
client.close();
