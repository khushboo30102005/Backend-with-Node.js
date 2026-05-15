import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://127.0.0.1:27017/');
await client.connect();
const db = client.db('todoApp');
const collection = db.collection('todos');
const cursor = collection.find(); //asyncIterator
console.log(await collection.countDocuments())  //25
console.log(cursor)
for await (const document of cursor) {
  console.log(document);
}
console.log("**********************************")
console.log(await cursor.next())
console.log(await cursor.next())
console.log(await cursor.hasNext());
let count = 0;
while (await cursor.hasNext()) {
  count++;
  console.log(await cursor.next());
  if (count === 5) break;
}
console.log(await cursor.hasNext());
console.log(await cursor.toArray());
client.close();
