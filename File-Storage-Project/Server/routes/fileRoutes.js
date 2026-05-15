import express from 'express';
import { createWriteStream } from 'fs';
import { rm, writeFile } from 'fs/promises';
import path from 'path';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.param('parentDirId', validateIdMiddleware);

router.param('id', validateIdMiddleware);
// ================================
// CREATE
// ================================
router.post('/{:parentDirId}', async (req, res, next) => {
  const db = req.db;
  const user = req.user;
  const dirCollection = db.collection('directories');
  const filesCollection = db.collection('files');
  const parentDirId = req.params.parentDirId || user.rootDirId;

  // Check if parent directory exists

  try {
    const parentDirData = await dirCollection.findOne({
      _id: new ObjectId(parentDirId),
      userId: user._id,
    });
    if (!parentDirData) {
      return res.status(404).json({ error: 'Parent directory not found!' });
    }

    const filename = req.headers.filename || 'untitled';
    const extension = path.extname(filename);
    const insertedFile = await filesCollection.insertOne({
      extension,
      name: filename,
      parentDirId: parentDirData._id,
      userId: req.user._id,
    });

    const fileId = insertedFile.insertedId.toString();
    const fullFileName = `${fileId}${extension}`;
    const writeStream = createWriteStream(`./storage/${fullFileName}`);
    req.pipe(writeStream);

    req.on('end', async () => {
      return res.status(201).json({ message: 'File Uploaded' });
    });

    req.on('error', async () => {
      await filesCollection.deleteOne({ _id: insertedFile.insertedId });
      return res.status(404).json({ message: 'could not upload file' });
    });
  } catch (err) {
    next(err);
  }
});

// ================================
// READ
// ================================
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const fileCollection = db.collection('files');
  const fileData = await fileCollection.findOne({
    _id: new ObjectId(id),
    userId: req.user._id,
  });
  // Check if file exists
  if (!fileData) {
    return res.status(404).json({ error: 'File not found!' });
  }

  const filepath = path.join(
    process.cwd(),
    'storage',
    `${id}${fileData.extension}`,
  );
  if (req.query.action === 'download') {
    res.download(filepath, fileData.name);
  }

  // Send file
  return res.sendFile(filepath, (err) => {
    if (!res.headersSent && err) {
      return res.status(404).json({ error: 'File not found!' });
    }
  });
});

// ================================
// UPDATE
// ================================
router.patch('/:id', async (req, res, next) => {
  const { id } = req.params;
  const db = req.db;
  const fileCollection = db.collection('files');
  const fileData = await fileCollection.findOne({
    _id: new ObjectId(id),
    userId: req.user._id,
  });

  // Check if file exists
  if (!fileData) {
    return res.status(404).json({ error: 'File not found!' });
  }

  // Perform rename
  try {
    await fileCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: req.body.newFilename } },
    );
    return res.status(200).json({ message: 'Renamed' });
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

// ================================
// DELETE
// ================================
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  const db = req.db;
  const fileCollection = db.collection('files');
  const fileData = await fileCollection.findOne({
    _id: new ObjectId(id),
    userId: req.user._id,
  });
  if (!fileData) {
    return res.status(404).json({ error: 'File not found!' });
  }
  try {
    await rm(`./storage/${id}${fileData.extension}`, { recursive: true });
    await fileCollection.deleteOne({ _id: fileData._id });
    return res.status(200).json({ message: 'File Deleted Successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
