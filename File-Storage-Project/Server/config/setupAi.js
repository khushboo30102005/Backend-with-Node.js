// Run once:  npm run setup:ai   (same style as config/setup.js)
import mongoose from 'mongoose';
import { connectDB } from './db.js';

await connectDB();

const db = mongoose.connection.db;
const client = mongoose.connection.getClient();

try {
  const name = 'fileinsights';
  if (!(await db.listCollections({ name }).hasNext())) {
    await db.createCollection(name);
    console.log(`Created collection: ${name}`);
  }

  const num = ['int', 'long', 'double'];
  await db.command({
    collMod: name,
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'fileId', 'userId', 'status'],
        properties: {
          _id: { bsonType: 'objectId' },
          __v: { bsonType: 'int' },
          fileId: { bsonType: 'objectId' },
          userId: { bsonType: 'objectId' },
          status: {
            bsonType: 'string',
            enum: ['queued', 'processing', 'done', 'failed', 'unsupported'],
          },
          errorCode: { bsonType: ['null', 'string'] },
          errorMessage: { bsonType: ['null', 'string'] },
          summary: { bsonType: 'string' },
          category: { bsonType: ['null', 'string'] },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
          embedding: { bsonType: 'array', items: { bsonType: num } },
          provider: { bsonType: ['null', 'string'] },
          model: { bsonType: ['null', 'string'] },
          embedModel: { bsonType: ['null', 'string'] },
          truncated: { bsonType: 'bool' },
          charCount: { bsonType: num },
          analyzedAt: { bsonType: ['null', 'date'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });

  const col = db.collection(name);
  await col.createIndex({ fileId: 1 }, { unique: true });
  await col.createIndex({ userId: 1, status: 1 });
  console.log('AI collection and indexes are ready.');
} catch (error) {
  console.error('AI setup failed:', error);
} finally {
  await client.close();
}
