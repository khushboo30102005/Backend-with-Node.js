import { MongoClient } from "mongodb";

const connectionUrl = "mongodb+srv://USERNAME:PASSWORD@CLUSTER_URL/DATABASE_NAME"

const client = new MongoClient(connectionUrl);

await client.connect();

const db = client.db();
const collection = db.collection("users");
const data = await collection.find().toArray();
// await collection.insertOne({ name: "Khushboo" });

console.log(data);
client.close();
