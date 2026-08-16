import express from 'express';
import mongoose from 'mongoose';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const app = express();

app.use(express.json());

await mongoose.connect(process.env.DB_URL);

const postSchema = new mongoose.Schema({
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', postSchema);

// Middleware
app.use(express.static('./public'));

// Routes
app.get('/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.setHeader('Set-Cookie', 'loginSecret=hdxhw7yrx.k');
  res.json(posts);
});

app.post('/posts', async (req, res) => {
  const content = purify.sanitize(req.body.content);
  console.log(content);
  const post = new Post({ content });
  await post.save();
  res.status(201).json(post);
});

// Start server
app.listen(4000, () => console.log('Server running on http://localhost:4000'));
