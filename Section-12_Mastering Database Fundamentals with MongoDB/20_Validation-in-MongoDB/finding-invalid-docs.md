# Finding Invalid Documents

- When `validationAction: "warn"` is used, invalid documents can still be stored in the collection.

- Before setting schema validation, you might already have invalid documents in your collection.

- And before you can fix them, you need to find them.
## Query : for shell

```js
db.users.find({
  $nor: [
    {
      $jsonSchema:
        db.getCollectionInfos({ name: "users" })[0]
          .options.validator.$jsonSchema
    }
  ]
});
```

## Meaning

Finds documents that do NOT follow the collection validation schema.

## Use Case

Useful for:
- finding invalid documents
- checking schema violations
- cleaning old data