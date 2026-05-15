import {MongoClient} from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');

await  client.connect();

const admin = client.db().admin();

console.log(await admin.listDatabases())