## Mongoose: 

***Mongoose is a popular ODM (Object Data Modeling) library used to connect Node.js applications with MongoDB***
#### full form of ODM is:
- ODM (Object Data Modeling)
- ODM (Object Document Modeling)
- ODM (Object Document Mapping)
- ODM (Object Document Mapper)



# Mongoose Query Buffering

## Definition
Query Buffering is a Mongoose feature that temporarily stores database queries when MongoDB is not connected. Once the connection is established, Mongoose automatically executes the buffered queries.

## Example

```javascript
User.find(); // Executed before connection

await mongoose.connect(connectionUrl);
```

Mongoose buffers the query and executes it after the connection is established.

## Timeout Error

```text
MongooseError:
Operation users.find() buffering timed out after 10000ms
```

This occurs when Mongoose waits for a database connection but cannot connect within the timeout period.

## Disable Buffering

```javascript
mongoose.set("bufferCommands", false);
```

or

```javascript
const schema = new mongoose.Schema({}, {
  bufferCommands: false
});
```

## Best Practice

```javascript
await mongoose.connect(connectionUrl);
app.listen(3000);
```

Connect to the database before starting the server.

## Key Points

- Queries wait for database connection.
- Mongoose stores pending queries in a buffer.
- Buffered queries execute automatically after connection.
- Timeout errors occur if connection fails.
- Recommended: connect first, then start the application.