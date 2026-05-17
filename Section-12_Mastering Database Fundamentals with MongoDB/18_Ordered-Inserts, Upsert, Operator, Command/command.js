
// Command is a method on db that allows you to run any command on the database. It takes an object as an argument, where the key is the name of the command and the value is the arguments for that command.

// db.command({insert: 'users', documents: [{name: 'Alice'}, {name: 'Bob'}]}) // this will insert two documents into the users collection. The first document will have the name Alice and the second document will have the name Bob.

// In mongo shell it as db.runCommand({insert: 'users', documents: [{name: 'Alice'}, {name: 'Bob'}]})

import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017'); // we need to connect to the admin database to run the listDatabases command.

await client.connect();

const db = client.db();

// const dbs = await db.command({listDatabases: 1}) // this will return a list of all the databases in the MongoDB instance.
// const cmds = await db.command({listCommands: 1}) // this will return a list of all the commands in the MongoDB instance.
// const stats = await db.command({dbStats: 1}) // this will return information about the database.

// console.log(collections.cursor.firstBatch);  
// console.log(stats);

// const result = await db.command({create: "myCollection"}) // this will create a new collection called myCollection in the current database.

// const result = await db.command({renameCollection: "myCollection", to: "newCollection"}) // only run against admin databases.

// const result = await db.command({drop: "myCollection"}) // this will drop the collection called myCollection in the current database.

const result = await db.command({ hostInfo: 1 }) // this will return information about the host that the MongoDB instance is running on.
console.log(result);

client.close();