## What are Virtuals in Mongoose?

**A virtual is a property that does not get stored in MongoDB, but behaves like a normal field when you work with Mongoose documents.**

It is computed dynamically from existing data or used to define custom getters/setters.

## Key Characteristics

- Not included in MongoDB documents.

- Can be used to derive values from other fields.
- Not saved in the database.
- Can define getters and setters.
- Can also be used for virtual populate.
