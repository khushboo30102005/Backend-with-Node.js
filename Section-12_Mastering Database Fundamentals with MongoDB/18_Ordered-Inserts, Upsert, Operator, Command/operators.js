
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

await client.connect();

const db = client.db();

const collection = db.collection('users');


client.close();