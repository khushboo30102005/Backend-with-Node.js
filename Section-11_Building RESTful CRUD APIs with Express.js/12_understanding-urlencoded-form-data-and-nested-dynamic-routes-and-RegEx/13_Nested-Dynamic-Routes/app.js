import express from 'express';

const app = express();

const port = 4000;

app.get('/blogs/:blogId', (req, res) => {
  console.log(req.params);
  res.json(req.params);
});

app.get('/blogs/:blogId/comments', (req, res) => {
  console.log(req.params);
  console.log('comments');
  res.json(req.params);
});

app.get('/blogs/:blogId/comments/:commentId', (req, res) => {
  console.log(req.params);
  console.log('comments');
  res.json(req.params);
});

app.listen(port, () => {
  console.log('Sever Started>');
});
