import express from 'express';
import { createWriteStream } from 'fs';
import { open, readdir, rename, rm } from 'fs/promises';

const app = express();

const port = 4000;

app.use(express.json());
// Enable CORS
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  });
  next();
});

// app.use(express.static('public'));
// This code is equals to :

// app.use((req, res, next) => {
//   express.static('public')(req, res, next)
// })

//  now we can :

// Serve Dir Content
app.get('/', async (req, res) => {
  const publicContent = await readdir('./public');
  res.json(publicContent);
});


// Upload a file: CREATE
app.post('/:filename', async (req, res) => {
  const { filename } = req.params;
  const writeStream = createWriteStream(`./public/${filename}`);
  req.pipe(writeStream);
  req.on('end', () => {
    res.json({ message: 'File Uploaded Successfully' });
  });
});


// Dynamic Routing : READ
app.get('/:filename', (req, res, next) => {
  if (req.query.action === 'download') {
    res.set('Content-Disposition', 'attachment');
  }
  const { filename } = req.params;
  res.sendFile(`${import.meta.dirname}/public/${filename}`);
});


// Rename a File: UPDATE
app.patch('/:oldFilename', async (req, res) => {
  try {
    const { oldFilename } = req.params;
    console.log(oldFilename);
    await rename(`public/${oldFilename}`, `public/${req.body.newFilename}`);
    res.json({ message: 'Renamed Successfully' });
  } catch (error) {
    res.json({ message: error.message });
  }
});


// handling deletion : DELETE
app.delete('/:filename', async (req, res) => {
  const { filename } = req.params;
  try {
    await rm(`public/${filename}`);
    res.json({message: 'File Deleted Successfully'});
  } catch (error) {
    res.status(404).json({ message: 'no such file or directory' });
  }
});

// Start Server
app.listen(port, () => {
  console.log('server Started');
});
