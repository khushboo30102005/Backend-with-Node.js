import express from 'express';
import { createReadStream, createWriteStream, read } from 'fs';
import { mkdir, open, readdir, rename, rm, stat } from 'fs/promises';
import cors from 'cors';
import path from 'path';
import e from 'express';

const router = express.Router();

router.get('/{*splat}', async (req, res) => {
  const pathName = path.join('/', req.params.splat?.join('/') || '');
  try {
    const filesList = await readdir(
      `./public${pathName ? `/${pathName}` : ''}`,
    );
    const resData = [];
    for (const item of filesList) {
      const stats = await stat(
        `./public${pathName ? `/${pathName}` : ''}/${item}`,
      );
      resData.push({
        name: item,
        isDirectory: stats.isDirectory(),
      });
    }
    res.json(resData);
  } catch (err) {
    res.status(404).json({ message: 'No such file or directory' });
  }
});

// Create a directory: CREATE
router.post('/*splat', async (req, res) => {
  const pathName = path.join('/', req.params.splat?.join('/'));
  const isDirName = req.params.splat?.slice(-1)[0] == '' ? false : true;
  console.log(req.params.splat?.slice(-1), { isDirName });
  try {
    if (isDirName) {
      await mkdir(`./public${pathName ? `/${pathName}` : ''}`, {
        recursive: true,
      });
      res.json({ message: 'Directory Created Successfully' });
    } else {
      res.status(400).json({ message: 'Directory name is required' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating directory' });
  }
});

export default router;