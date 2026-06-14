# Mongoose Document Versioning (`__v`) :

## What is Document Versioning?

Document versioning is a mechanism used by Mongoose to track changes
made to a document and detect certain types of concurrent update
conflicts.

Mongoose implements this feature using a special field called `__v`.

------------------------------------------------------------------------

## Version Key (`__v`)

When a document is created, Mongoose automatically adds a version key
unless it is explicitly disabled.

Example:

``` js
{
  _id: ObjectId(...),
  name: "Khushboo",
  email: "abc@example.com",
  __v: 0
}
```

### Key Points

-   `__v` stands for **version key**.
-   It stores the **current version number** of the document.
-   New documents start with `__v = 0`.

------------------------------------------------------------------------

## How Versioning Works

### Initial Insert

``` js
const user = await User.create({
  name: "Khushboo"
});
```

Stored document:

``` js
{
  _id: ...,
  name: "Khushboo",
  __v: 0
}
```

------------------------------------------------------------------------

## Why is Versioning Needed?

Versioning helps prevent problems caused by multiple users or processes
modifying the same document simultaneously.

### Example Scenario

Initial document:

``` js
{
  hobbies: ["Reading"],
  __v: 0
}
```

Two users fetch the same document:

``` js
const docA = await User.findById(id);
const docB = await User.findById(id);
```

Both receive:

``` js
__v: 0
```

User A updates and saves:

``` js
docA.hobbies.push("Coding");
await docA.save();
```

Database state:

``` js
{
  hobbies: ["Reading", "Coding"],
  __v: 1
}
```

User B still has an outdated copy (`__v: 0`).

Mongoose can detect this mismatch and prevent conflicting updates.

------------------------------------------------------------------------

## Optimistic Concurrency Control

Mongoose provides stricter version checking through **optimistic
concurrency**.

### Enabling Optimistic Concurrency

``` js
const userSchema = new mongoose.Schema(
  {
    name: String
  },
  {
    optimisticConcurrency: true
  }
);
```

### How It Works

1.  A document is loaded.
2.  Mongoose remembers its current `__v` value.
3.  During `save()`, Mongoose checks whether the stored version still
    matches.
4.  If the version has changed, Mongoose throws an error.

------------------------------------------------------------------------

## VersionError Example

Initial document:

``` js
{
  name: "Khushboo",
  __v: 0
}
```

Two copies are loaded:

``` js
const doc1 = await User.findById(id);
const doc2 = await User.findById(id);
```

First save:

``` js
doc1.name = "A";
await doc1.save();
```

Database:

``` js
{
  name: "A",
  __v: 1
}
```

Second save:

``` js
doc2.name = "B";
await doc2.save();
```

Result:

``` text
VersionError: No matching document found...
```

Reason:

-   `doc2` expected `__v = 0`
-   Database already had `__v = 1`

------------------------------------------------------------------------

## Methods That Use Versioning

### Uses Version Checks

``` js
document.save();
```

Especially when:

-   Optimistic concurrency is enabled.
-   Array modifications are involved.

------------------------------------------------------------------------

## Methods That Usually Bypass Versioning

``` js
Model.updateOne();
Model.updateMany();
Model.findOneAndUpdate();
```

These methods directly send update operations to MongoDB and generally
do not perform version checks automatically.

------------------------------------------------------------------------

## Disabling the Version Key

``` js
const schema = new mongoose.Schema(
  {
    name: String
  },
  {
    versionKey: false
  }
);
```

Stored document:

``` js
{
  _id: ...,
  name: "Khushboo"
}
```

### Consequences

-   `__v` will not be created.
-   Built-in version tracking is lost.

------------------------------------------------------------------------

# Summary

  Feature                   Description
  ------------------------- ------------------------------------------
  `__v`                     Mongoose version key
  Initial Value             `0`
  Purpose                   Track document revisions
  Main Benefit              Detect concurrent modification conflicts
  Commonly Used With        `document.save()`
  Strict Version Checking   `optimisticConcurrency: true`
  Error on Conflict         `VersionError`
  Disable Versioning        `versionKey: false`

------------------------------------------------------------------------

## Core Concept

Think of `__v` as a **revision number** for a document.

Whenever Mongoose determines that a document has moved to a new
revision, the version number changes. This allows Mongoose to identify
outdated copies of documents and reduce the risk of overwriting newer
changes accidentally.
