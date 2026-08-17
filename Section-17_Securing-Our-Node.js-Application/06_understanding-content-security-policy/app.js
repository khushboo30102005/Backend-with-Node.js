import express from 'express';
import mongoose from 'mongoose';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import crypto from "crypto";

const app = express();
app.use(express.json());
/* 
const data = await readFile('public\\script.js', 'utf8');
// console.log(data)


const hash = createHash('sha256').update(data).digest('base64');

console.log(hash); */

await mongoose.connect(
  'mongodb://admin:admin@localhost/socialApp?authSource=admin',
);

const postSchema = new mongoose.Schema({
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', postSchema);

// Middleware

app.use(async(req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64')
  if (req.headers.accept?.includes('text/html')) {
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self';\
       script-src 'self' 'nonce-${nonce}' 'report-sample';\
        img-src 'self' https://images.unsplash.com ;\
        style-src 'self' ;\
        connect-src 'self';\
        report-uri /csp-violations `,
    );
  }
  if(req.url === '/'){
    const indexHTMLFile = await readFile('./public/index.html', 'utf-8')
    return res.send(indexHTMLFile.replaceAll("${nonce}", nonce))
  }
  next();
});
/* app.use((req, res, next) => {
  if (req.headers.accept?.includes('text/html')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self';\
       script-src 'self' 'sha256-NvJY/NcV2VbEhKqz3Dk826f1Z++vPIXKAbfzxGYBo7A=' 'report-sample';\
        img-src 'self' https://images.unsplash.com ;\
        style-src 'self' ;\
        connect-src 'self';\
        report-uri /csp-violations ",
    );
  }
  next();
}); */

app.use(express.static('./public'));

// Routes
app.get('/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.setHeader('Set-Cookie', 'loginSecret=hdxhw7yrx.k;');
  res.json(posts);
});

app.post('/posts', async (req, res) => {
  console.log(req.body);
  const post = new Post({ content: req.body.content });
  await post.save();
  res.status(201).json(post);
});

app.post(
  '/csp-violations',
  express.json({ type: 'application/csp-report' }),
  (req, res) => {
    // console.log(req.body);
    res.status(204).end();
  },
);
// Start server
app.listen(4000, () => console.log('Server running on http://localhost:4000'));
