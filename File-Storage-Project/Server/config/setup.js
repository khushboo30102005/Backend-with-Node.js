import { connectDB, client } from './db.js';

const db = await connectDB();

console.log('Database Connected');
const command = 'collMod';

try {
  await db.command({
    [command]: 'users',
    validator: {
      $jsonSchema: {
        required: ['_id', 'name', 'email', 'password', 'rootDirId'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          name: {
            bsonType: 'string',
            minLength: 3,
            description: 'Name must be at least 3 characters long',
          },
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[A-Za-z]{2,}$',
            description: 'Email must be a valid email address',
          },
          password: {
            bsonType: 'string',
            minLength: 4,
          },
          rootDirId: {
            bsonType: 'objectId',
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
  await db.command({
    [command]: 'directories',
    validator: {
      $jsonSchema: {
        required: ['_id', 'name', 'parentDirId', 'userId'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          name: {
            bsonType: 'string',
            minLength: 3,
          },
          parentDirId: {
            bsonType: ['null', 'objectId'],
          },
          userId: {
            bsonType: 'objectId',
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
  await db.command({
    [command]: 'files',
    validator: {
      $jsonSchema: {
        required: ['_id', 'extension', 'name', 'parentDirId', 'userId'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          extension: {
            bsonType: 'string',
          },
          name: {
            bsonType: 'string',
            minLength: 3,
            description: 'Name must be at least 3 characters long',
          },
          parentDirId: {
            bsonType: 'objectId',
          },
          userId: {
            bsonType: 'objectId',
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
} catch (error) {
  console.error('Error occurred while setting up validation:', error);
} finally {
  client.close();
}
