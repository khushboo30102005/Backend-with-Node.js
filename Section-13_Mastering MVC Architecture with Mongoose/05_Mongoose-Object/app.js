import mongoose from 'mongoose';
mongoose.connect('mongodb://admin:admin@localhost');
console.log('Database connection connected..........');
mongoose.connection.on('connected', () => console.log('connected'));
mongoose.connection.on('open', () => console.log('open'));
mongoose.connection.on('disconnected', () => console.log('disconnected'));
mongoose.connection.on('reconnected', () => console.log('reconnected'));
mongoose.connection.on('disconnecting', () => console.log('disconnecting'));
mongoose.connection.on('close', () => console.log('close'));


/* const db = mongoose.connection.db

const fruits = await db.collection('fruits')
fruits.insertOne({name: "Apple", taste: "sweet"}) */ 

mongoose.disconnect()