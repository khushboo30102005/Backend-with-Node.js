# Multer

- Multer is a node.js middleware for handling multipart/form-data, primarily used for uploading files in Express applications.
- It efficiently processes file data and stores it on a server or in memory, supporting single, multiple, and mixed file uploads.
- Multer requires an enctype of multipart/form-data.

### Key Features and Usage:

- **Installation**: `npm install multer`.
- **Storage Options**:
  - **Disk Storage**: Allows saving files to a specific destination on the server with customized filenames using multer.diskStorage.
  - **Memory Storage**: Stores files in buffer memory, useful for transferring files to cloud storage like S3.

### File Handling Methods:

- **upload.single(fieldname)**: Handles a single file upload.
- **upload.array(fieldname[, maxCount])**: Handles multiple files from one field.
- **upload.fields(fields)**: Handles files from multiple fields.

### **Validation and Limits**

Supports fileFilter to accept/reject files and limits to set restrictions on file size.

### **Accessing Data**

The uploaded file information is available via req.file or req.files.
