import express from 'express';
import { createWriteStream } from 'fs';
import { open, readdir, rename, rm, stat } from 'fs/promises';
import cors from 'cors';

const app = express();

// Enable CORS
app.use(cors());

const port = 4000;

app.use(express.json());

app.get('/directory/{*splat}', async (req, res) => {
  const splat = req.params.splat?.join('/');
  const filesList = await readdir(`./public${splat ? `/${splat}` : ''}`);
  const resData = [];
  for (const item of filesList) {
    const stats = await stat(`./public${splat ? `/${splat}` : ''}/${item}`);
    resData.push({
      name: item,
      isDirectory: stats.isDirectory(),
    });
  }
  res.json(resData);
});

// Upload a file: CREATE
app.post('/files/*splat', async (req, res) => {
  const filePath = req.params.splat.join('/');
  const writeStream = createWriteStream(`./public/${filePath}`);
  req.pipe(writeStream);
  req.on('end', () => {
    res.json({ message: 'File Uploaded Successfully' });
  });
});

// Dynamic Routing : READ {.:ext}
app.get('/files/*splat', async (req, res, next) => {
  const filePath = req.params.splat.join('/');
  console.log(filePath);
  try {
    const { filename } = req.params;
    if (req.query.action === 'download') {
      res.set('Content-Disposition', 'attachment');
    }
    res.sendFile(`${import.meta.dirname}/public/${filePath}`);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Rename a File: UPDATE
app.patch('/files/*splat', async (req, res) => {
  const oldFilePath = req.params.splat.join('/');
  // const newFilePath = req.params.splat.slice(0, -1).join('/') + '/' + req.body.newFilename;

  try {
    const { filename } = req.params;
    await rename(`public/${oldFilePath}`, `public/${req.body.newFilename}`);
    res.json({ message: 'Renamed Successfully' });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// handling deletion : DELETE
app.delete('/files/{*splat}', async (req, res) => {
  const splat = req.params.splat?.join('/');
  console.log(splat)
  try {
    await rm(`public/${splat}`,  { recursive: true, force: true });
    res.json({ message: 'File Deleted Successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log('server Started');
});
