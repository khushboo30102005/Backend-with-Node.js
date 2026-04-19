import express from 'express';
import { readdir } from 'fs/promises';

const app = express();

const port = 4000;

// Enable CORS
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  });
  next();
});

// app.use(express.static('public'));
// This code is equals to :

// app.use((req, res, next) => {
//   express.static('public')(req, res, next)
// })

//  now we can :


// Serving File
app.use((req, res, next) => {
  if(req.query.action === 'download') {
    res.set('Content-disposition', 'attachment')
  }
  const serveStatic = express.static('public');
  serveStatic(req, res, next);
});

// Serve Dir Content
app.get('/', async (req, res) => {
  const publicContent = await readdir('./public');
  res.json(publicContent);
});


// Start Server
app.listen(port, () => {
  console.log('server Started');
});
