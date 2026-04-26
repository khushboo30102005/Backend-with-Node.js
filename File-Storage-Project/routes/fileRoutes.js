import express from 'express';
import { createWriteStream } from 'fs';
import { rename, rm, writeFile } from 'fs/promises';
import path from 'path';
import filesData from '../fileDB.json' with { type: 'json' };
import dirsData from '../dirsDB.json' with { type: 'json' };

const router = express.Router();

// Upload a file: CREATE
router.post('/{:parentDirId}', (req, res, next) => {
  const filename = req.headers.filename || 'Untitled';
  const parentDirId = req.params.parentDirId || dirsData[0].id;
  const extension = path.extname(filename);
  const id = crypto.randomUUID();
  const writeStream = createWriteStream(`./public/${id}${extension}`);
  req.pipe(writeStream);
  req.on('end', async () => {
    filesData.push({
      id,
      extension,
      name: filename,
      parentDirId,
    });
    const parentDirData = dirsData.find((dir) => dir.id === parentDirId);
    parentDirData.files.push(id);
    try {
      await writeFile('./fileDB.json', JSON.stringify(filesData));
      await writeFile('./dirsDB.json', JSON.stringify(dirsData));
      return res.status(201).json({ message: 'File Uploaded Successfully' });
    } catch (err) {
      next(err);
    }
  });
});

// Dynamic Routing : READ
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const fileData = filesData.find((file) => file.id === id);
  if (!fileData) {
    return res.status(404).json({ message: 'File Not Found!!' });
  }
  if (req.query.action === 'download') {
    res.set('Content-Disposition', `attachment; filename=${fileData.name}`);
  }
  return res.sendFile(
    `${process.cwd()}/public/${fileData.id}${fileData.extension}`,
    (err) => {
      if (!res.headersSent && err) {
        return res.status(404).json({ message: 'No such file' });
      }
    },
  );
});

// Rename a File: UPDATE
router.patch('/:id', async (req, res, next) => {
  const { id } = req.params;
  const fileData = filesData.find((file) => file.id === id);

  fileData.name = req.body.newFilename;
  await rename(
    `public/${fileData.id}${fileData.extension}`,
    `public/${fileData.id}${path.extname(req.body.newFilename)}`,
  );
  fileData.extension = path.extname(req.body.newFilename);
  try {
    await writeFile('./fileDB.json', JSON.stringify(filesData));
    res.status(200).json({ message: 'Renamed Successfully' });
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

// handling deletion : DELETE
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  const fileIndex = filesData.findIndex((file) => file.id === id);
  if (fileIndex === -1) {
    return res.status(404).json('File Not Found!!');
  }
  const fileData = filesData[fileIndex];
  const parentDirData = dirsData.find((dir) => dir.id === fileData.parentDirId);
  parentDirData.files = parentDirData.files.filter((fileId) => fileId !== id);
  try {
    await rm(`public/${fileData.id}${fileData.extension}`);
    filesData.splice(fileIndex, 1);
    await writeFile('./fileDB.json', JSON.stringify(filesData));
    await writeFile('./dirsDB.json', JSON.stringify(dirsData));
    return res.status(200).json({ message: 'File Deleted Successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
