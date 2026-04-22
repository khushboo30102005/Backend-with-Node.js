import express from 'express';
import { createReadStream, createWriteStream, read } from 'fs';
import { mkdir, open, readdir, rename, rm, stat } from 'fs/promises';
import path from 'path';

const router = express.Router();

// Upload a file: CREATE
router.post('/{*splat}', async (req, res) => {
  const filePath = path.join('/', req.params.splat?.join('/'));
  const writeStream = createWriteStream(`./public/${filePath}`);
  req.pipe(writeStream);
  req.on('end', () => {
    res.json({ message: 'File Uploaded Successfully' });
  });
});

// Dynamic Routing : READ
router.get('/*splat', async (req, res, next) => {
  try {
    const filePath = path.join('/', req.params.splat?.join('/'));
    console.log({ filePath });
    if (req.query.action === 'download') {
      res.set('Content-Disposition', 'attachment');
    }
    console.log(`${process.cwd()}/public/${filePath}`)
    res.sendFile(`${process.cwd()}/public/${filePath}`, (err) => {
      if (err) {
        res.status(404).json({ message: 'No such file or directory' });
      }
    });
  } catch (error) {
    res.status(404).json({ message: 'No such file or directory' });
  }
});

// Rename a File: UPDATE
router.patch('/*splat', async (req, res) => {
  const filename = path.join('/', req.params.splat?.join('/'));
  try {
    await rename(`public/${filename}`, `public/${req.body.newFilename}`);
    res.json({ message: 'Renamed Successfully' });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// handling deletion : DELETE
router.delete('/{*splat}', async (req, res) => {
  const pathName = path.join('/', req.params.splat?.join('/'));
  try {
    await rm(`public/${pathName}`, { recursive: true, force: true });
    res.json({ message: 'File Deleted Successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
