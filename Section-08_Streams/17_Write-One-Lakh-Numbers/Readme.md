# Why Streams are so fast:

**Repeated file operations using writeFile/appendFile are slow**
Why:
Because When these methods write to a file, they follow three main steps:

1. **Find the file and open it**
2. **Write data in file**
3. **Close the file**

Every time file opens and closes, and the process becomes longer and inefficient.

**BUT** if we use Stream and create a writeStream with `createWriteStream()`, Now this time file open with `createWriteStream()` method and close with `writeStream.end()` method. Between this time the file was opened, OS do not need to open it again and again.

The `writeStream.write()` method writes data to an internal buffer, not directly into file(disk).

This process makes it faster **because**:

- Data is first buffered in RAM before being written to disk, which allows faster and more efficient disk operations.
