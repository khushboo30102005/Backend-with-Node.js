import mongoose from 'mongoose';
import { connectDB } from './db.js';

await connectDB(process.env.MONGODB_URI);

const db = mongoose.connection.db;
const client = mongoose.connection.getClient();

console.log('Database Connected');

const command = 'collMod';

try {
  // =========================
  // Users Collection
  // =========================
  await db.command({
    [command]: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: ['_id', 'name', 'email', 'rootDirId', 'maxStorageInBytes'],

        properties: {
          _id: {
            bsonType: 'objectId',
          },

          __v: {
            bsonType: 'int',
          },

          name: {
            bsonType: 'string',
            minLength: 3,
            description: 'Name must be at least 3 characters long',
          },

          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[A-Za-z]{2,}$',
            description: 'Email must be a valid email address',
          },

          password: {
            bsonType: 'string',
            minLength: 3,
            description: 'Password must be at least 3 characters long',
          },

          picture: {
            bsonType: 'string',
          },

          role: {
            bsonType: 'string',
            enum: ['Admin', 'Manager', 'User', 'Owner'],
          },

          isDeleted: {
            bsonType: 'bool',
          },

          rootDirId: {
            bsonType: 'objectId',
          },

          maxStorageInBytes: {
            bsonType: ['int', 'long', 'double'],
          },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  // =========================
  // Directories Collection
  // =========================
  await db.command({
    [command]: 'directories',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: ['_id', 'name', 'size', 'userId', 'path'],

        properties: {
          _id: {
            bsonType: 'objectId',
          },

          __v: {
            bsonType: 'int',
          },

          name: {
            bsonType: 'string',
            minLength: 3,
            maxLength: 100,
            description: 'Directory name must be between 3 and 100 characters',
          },

          size: {
            bsonType: ['int', 'long', 'double'],
          },

          userId: {
            bsonType: 'objectId',
          },

          parentDirId: {
            bsonType: ['null', 'objectId'],
          },

          path: {
            bsonType: 'array',
            items: {
              bsonType: 'objectId',
            },
          },

          isTrashed: {
            bsonType: 'bool',
          },

          trashedAt: {
            bsonType: ['null', 'date'],
          },

          createdAt: {
            bsonType: 'date',
          },

          updatedAt: {
            bsonType: 'date',
          },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  // =========================
  // Files Collection
  // =========================
  await db.command({
    [command]: 'files',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: ['_id', 'name', 'size', 'extension', 'userId'],

        properties: {
          _id: {
            bsonType: 'objectId',
          },

          __v: {
            bsonType: 'int',
          },

          name: {
            bsonType: 'string',
          },

          size: {
            bsonType: ['int', 'long', 'double'],
          },

          extension: {
            bsonType: 'string',
          },

          userId: {
            bsonType: 'objectId',
          },

          parentDirId: {
            bsonType: ['null', 'objectId'],
          },

          isTrashed: {
            bsonType: 'bool',
          },

          trashedAt: {
            bsonType: ['null', 'date'],
          },

          createdAt: {
            bsonType: 'date',
          },

          updatedAt: {
            bsonType: 'date',
          },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  // =========================
  // OTP Collection
  // =========================
  await db.command({
    [command]: 'otps',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: ['_id', 'email', 'otp', 'createdAt'],

        properties: {
          _id: {
            bsonType: 'objectId',
          },

          __v: {
            bsonType: 'int',
          },

          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[A-Za-z]{2,}$',
            description: 'Email must be a valid email address',
          },

          otp: {
            bsonType: 'string',
            minLength: 1,
            description: 'OTP must be stored as a string',
          },

          createdAt: {
            bsonType: 'date',
          },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  // OTP unique email index
  await db.collection('otps').createIndex({ email: 1 }, { unique: true });

  // OTP TTL: 600 seconds = 10 minutes
  await db
    .collection('otps')
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });

  // =========================
  // Share Collection
  // =========================
  await db.command({
    [command]: 'shares',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: [
          '_id',
          'resourceId',
          'resourceType',
          'ownerId',
          'sharedWithUserId',
          'permission',
          'createdAt',
          'updatedAt',
        ],

        properties: {
          _id: {
            bsonType: 'objectId',
          },

          __v: {
            bsonType: 'int',
          },

          resourceId: {
            bsonType: 'objectId',
          },

          resourceType: {
            bsonType: 'string',
            enum: ['file'],
          },

          ownerId: {
            bsonType: 'objectId',
          },

          sharedWithUserId: {
            bsonType: 'objectId',
          },

          permission: {
            bsonType: 'string',
            enum: ['viewer', 'editor'],
          },

          seenAt: { 
            bsonType: ['null', 'date'] 
          },

          createdAt: {
            bsonType: 'date',
          },

          updatedAt: {
            bsonType: 'date',
          },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  // A file can only be shared with the same user once
  await db.collection('shares').createIndex(
    {
      resourceId: 1,
      sharedWithUserId: 1,
    },
    {
      unique: true,
    },
  );

  await db.collection('shares').updateMany(
  { seenAt: { $exists: false } },
  { $set: { seenAt: new Date() } },
);
  console.log('MongoDB validation rules applied successfully.');
} catch (error) {
  console.error('Error occurred while setting up validation:', error);
} finally {
  await client.close();
}
