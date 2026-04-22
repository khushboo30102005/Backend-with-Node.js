import express from 'express';
import dirRoutes from './routes/dirRoutes.js'
import filesRoutes from './routes/fileRoutes.js'
import { createReadStream, createWriteStream, read } from 'fs';
import { mkdir, open, readdir, rename, rm, stat } from 'fs/promises';
import cors from 'cors';
import path from 'path';

const app = express();

// Enable CORS
app.use(cors());

const port = 4000;

app.use(express.json());

app.use('/directory', dirRoutes);
app.use('/files', filesRoutes);


// Start Server
app.listen(port, () => {
  console.log('server Started');
});
