import mongoose from 'mongoose';
import { connectDB } from './db.js';

await connectDB(process.env.MONGODB_URI);

const db = mongoose.connection.db;
const client = mongoose.connection.getClient();

console.log('Database Connected');

const command = 'collMod';

// collMod fails on collections that don't exist yet (fresh database), so create them first
for (const name of ['users', 'directories', 'files', 'otps', 'shares', 'workspaces', 'workspacefiles', 'workspacevisits', 'workspacefolders', 'workspaceactivities', 'subscriptions', 'payments', 'webhookevents']) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name);
    console.log(`Created collection: ${name}`);
  }
}

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

          // In-flight upload reservations (root directories only).
          pendingUploads: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['id', 'bytes', 'at'],
              properties: {
                id: { bsonType: 'string' },
                bytes: { bsonType: ['int', 'long', 'double'] },
                fileId: { bsonType: ['null', 'objectId'] },
                objectKey: { bsonType: ['null', 'string'] },
                uploadId: { bsonType: ['null', 'string'] },
                at: { bsonType: 'date' },
              },
              additionalProperties: false,
            },
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

  // Upload-reservation sweeper (mirrors directoryModel.js)
  await db
    .collection('directories')
    .createIndex({ 'pendingUploads.at': 1 }, { sparse: true });

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

  // =========================
  // Workspaces Collection (Ephemeral Workspace)
  // =========================
  await db.command({
    [command]: 'workspaces',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: ['_id', 'name', 'ownerId', 'expiresAt', 'status', 'cleanupPolicy'],

        properties: {
          _id: { bsonType: 'objectId' },
          __v: { bsonType: 'int' },
          name: { bsonType: 'string', minLength: 3, maxLength: 100 },
          description: { bsonType: 'string', maxLength: 500 },
          ownerId: { bsonType: 'objectId' },
          members: {
            bsonType: 'array',
            maxItems: 50,
            items: {
              bsonType: 'object',
              required: ['userId', 'role'],
              properties: {
                userId: { bsonType: 'objectId' },
                role: { bsonType: 'string', enum: ['editor', 'viewer'] },
                status: { bsonType: 'string', enum: ['pending', 'active'] },
                joinedAt: { bsonType: ['null', 'date'] },
                addedAt: { bsonType: 'date' },
                addedBy: { bsonType: ['null', 'objectId'] },
                seenAt: { bsonType: ['null', 'date'] },
              },
              additionalProperties: false,
            },
          },
          expiresAt: { bsonType: 'date' },
          cleanupPolicy: { bsonType: 'string', enum: ['archive', 'delete'] },
          status: { bsonType: 'string', enum: ['active', 'expired', 'purged'] },
          expiredAt: { bsonType: ['null', 'date'] },
          purgeAfter: { bsonType: ['null', 'date'] },
          purgedAt: { bsonType: ['null', 'date'] },
          size: { bsonType: ['int', 'long', 'double'] },
          cleanup: {
            bsonType: 'object',
            properties: {
              attempts: { bsonType: ['int', 'long', 'double'] },
              lastError: { bsonType: ['null', 'string'] },
              lastAttemptAt: { bsonType: ['null', 'date'] },
              lockedUntil: { bsonType: ['null', 'date'] },
            },
            additionalProperties: false,
          },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  await db.collection('workspaces').createIndex({ ownerId: 1 });
  await db.collection('workspaces').createIndex({ 'members.userId': 1 });
  await db.collection('workspaces').createIndex({ status: 1, expiresAt: 1 });
  await db.collection('workspaces').createIndex({ status: 1, purgeAfter: 1 });

  // =========================
  // Workspace Files Collection
  // =========================
  await db.command({
    [command]: 'workspacefiles',
    validator: {
      $jsonSchema: {
        bsonType: 'object',

        required: ['_id', 'workspaceId', 'name', 'size', 'uploadedBy'],

        properties: {
          _id: { bsonType: 'objectId' },
          __v: { bsonType: 'int' },
          workspaceId: { bsonType: 'objectId' },
          name: { bsonType: 'string', maxLength: 255 },
          size: { bsonType: ['int', 'long', 'double'] },
          extension: { bsonType: 'string' },
          uploadedBy: { bsonType: 'objectId' },
          isReady: { bsonType: 'bool' },
          folderId: { bsonType: ['null', 'objectId'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },

        additionalProperties: false,
      },
    },

    validationAction: 'error',
    validationLevel: 'strict',
  });

  await db.collection('workspacefiles').createIndex({ workspaceId: 1, createdAt: -1 });
  await db.collection('workspacefiles').createIndex({ workspaceId: 1, folderId: 1 });
  await db.collection('workspacefiles').createIndex({ isReady: 1, createdAt: 1 });

  // =========================
  // Workspace Folders Collection
  // =========================
  await db.command({
    [command]: 'workspacefolders',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'workspaceId', 'name', 'createdBy'],
        properties: {
          _id: { bsonType: 'objectId' },
          __v: { bsonType: 'int' },
          workspaceId: { bsonType: 'objectId' },
          parentId: { bsonType: ['null', 'objectId'] },
          name: { bsonType: 'string', minLength: 1, maxLength: 100 },
          createdBy: { bsonType: 'objectId' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
  await db
    .collection('workspacefolders')
    .createIndex({ workspaceId: 1, parentId: 1, name: 1 }, { unique: true });

  // =========================
  // Workspace Activity Collection (audit trail)
  // =========================
  await db.command({
    [command]: 'workspaceactivities',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'workspaceId', 'type'],
        properties: {
          _id: { bsonType: 'objectId' },
          __v: { bsonType: 'int' },
          workspaceId: { bsonType: 'objectId' },
          actorId: { bsonType: ['null', 'objectId'] },
          type: { bsonType: 'string', maxLength: 40 },
          targetName: { bsonType: 'string', maxLength: 255 },
          targetUserId: { bsonType: ['null', 'objectId'] },
          detail: { bsonType: 'string', maxLength: 255 },
          createdAt: { bsonType: 'date' },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
  await db.collection('workspaceactivities').createIndex({ workspaceId: 1, createdAt: -1 });

  // =========================
  // Workspace Visits Collection (drives "new files" notifications)
  // =========================
  await db.command({
    [command]: 'workspacevisits',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'workspaceId', 'userId', 'lastSeenAt'],
        properties: {
          _id: { bsonType: 'objectId' },
          __v: { bsonType: 'int' },
          workspaceId: { bsonType: 'objectId' },
          userId: { bsonType: 'objectId' },
          lastSeenAt: { bsonType: 'date' },
          ackedExpiry: { bsonType: ['null', 'date'] },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });

  await db
    .collection('workspacevisits')
    .createIndex({ workspaceId: 1, userId: 1 }, { unique: true });

  // =========================
  // Payments / subscriptions (indexes mirror the Mongoose models exactly)
  // =========================
  await db.collection('subscriptions').createIndex({ userId: 1 }, { unique: true });
  await db.collection('subscriptions').createIndex({ status: 1, expiresAt: 1 });
  await db.collection('payments').createIndex({ razorpayOrderId: 1 }, { unique: true });
  await db.collection('payments').createIndex(
    { razorpayPaymentId: 1 },
    { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string' } } },
  );
  await db.collection('payments').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('webhookevents').createIndex({ eventId: 1 }, { unique: true });
  await db
    .collection('webhookevents')
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

  console.log('MongoDB validation rules applied successfully.');
} catch (error) {
  console.error('Error occurred while setting up validation:', error);
} finally {
  await client.close();
}