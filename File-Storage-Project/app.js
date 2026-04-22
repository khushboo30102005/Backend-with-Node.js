import express from 'express';
import { createReadStream, createWriteStream, read } from 'fs';
import { mkdir, open, readdir, rename, rm, stat } from 'fs/promises';
import cors from 'cors';

const app = express();

// Enable CORS
app.use(cors());

const port = 4000;

app.use(express.json());

// Path Traversal Vulnerability detection (A Dangerous Security Risk, Not Recommended)

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


// Create a directory: CREATE
app.post('/directory/{*splat}', async (req, res) => {
  console.log(req.params.splat?.slice(-1));
  const splat = req.params.splat?.join('/');
  const isDirName = req.params.splat?.slice(-1)[0] == '' ? false : true;
  console.log(req.params.splat?.slice(-1), { isDirName });
  console.log(splat);
  try {
    if (isDirName) {
      await mkdir(`./public${splat ? `/${splat}` : ''}`, { recursive: true });
      res.json({ message: 'Directory Created Successfully' });
    } else {
      res.status(400).json({ message: 'Directory name is required' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a file: CREATE
app.post('/files/{*splat}', async (req, res) => {
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
    // res.sendFile(`${import.meta.dirname}/public/${filePath}`);
    const readStream = createReadStream((`${import.meta.dirname}/public/${filePath}`));
    readStream.pipe(res);
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
  console.log(splat);
  try {
    await rm(`public/${splat}`, { recursive: true, force: true });
    res.json({ message: 'File Deleted Successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log('server Started');
});
