import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://127.0.0.1:27017/storageApp');

export async function connectDB() {
  await client.connect();
  const db = client.db();
  return db;
}
// signal interrupt handler to close the database connection gracefully
process.on('SIGINT', async ()=> {
  client.close();
  console.log('Database disconnected');
  process.exit(0);
})