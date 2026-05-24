// 1.  UI (MONGODB COMPASS) validation :
//  this is a basic validation, it will check the type of the field and the range of the field, but it will not check for extra fields, it will allow extra fields to be added in the document.
/* {
  name: {
    $type: 'string'
  },
  age: {
    $type: 'int',
    $gte: 18,
    $lte: 80
  }
}
 */

import { Collection, MongoClient } from 'mongodb';
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
await client.connect();
const db = client.db();

const collection = db.collection('users');
/* //2.  validation using command in the code : The collection must exist before we can apply validation rules to it, so we need to create the collection first and then apply the validation rules using the collMod command.
await db.command({
  collMod: 'users',
  validator: {
    name: {
      $type: 'string',
    },
    age: {
      $type: 'int',
      $gte: 18,
      $lte: 80,
    },
  },
  validationAction: 'warn',
});
 */

//  Creating new collection with validation rules:

/* // 3. validation using create command : we can create a collection with validation rules using the create command, this will create a new collection with the specified validation rules, if the collection already exists it will throw an error if we change the validator.
const usersColl = await db.command({
  create: 'users2',
  validator: {
    name: {
      $type: 'string',
    },
    age: {
      $type: 'int'
    },
  }
});
 */
/* // 4. validation using createCollection method :
const usersColl = await db.createCollection('users', {
  validator: {
    name: {
      $type: 'string',
    },
    age: {
      $type: 'int',
      $gte: 18,
      $lte: 80,
    },
  }
});
console.log({usersColl}); */

/* // ADD JSON SCHEMA VALIDATION RULES :
const usersColl = await db.command({
  collMod: 'users',
  validator: {
    $jsonSchema: {
      required: ['name', 'age'],
      properties: {
        _id: {
          bsonType: 'objectId',
        },
        name: {
          bsonType: 'string',
          minLength: 3,
        },
        age: {
          bsonType: 'int',
          minimum: 18,
          maximum: 80,
        },
        role: {
          enum: ['user', 'admin', 'host'],
        },
      },
      additionalProperties: false,
    },
  },
  validationAction: 'error',
  validationLevel: 'strict',
});
console.log({ usersColl });
const infos = await db.listCollections().toArray();
console.log(infos[0].options); */
/* try {
  await collection.insertOne({
    name: 'khushboo',
    age: 18,
    skill: 'JavaScript',
  }); // basic validation is not strict for extra fields, it will allow extra fields to be added in the document.
} catch (error) {
  console.error(error);
} */


/* // FINDING INVALID DOCUMENTS IN THE COLLECTION :
const invalidDocs = await db.command({
  validate: 'users'
}); */
const collectionInfo = await db.listCollections({ name: 'users' }).toArray();
const jsonSchema = collectionInfo[0].options.validator.$jsonSchema;

const invalidDocs = await collection.find({
  $nor: [
    {
      $jsonSchema: jsonSchema
    }
  ]
}).toArray();
console.log(invalidDocs);


client.close();
