import express, { text, urlencoded } from 'express';

const app = express();

app.use(express.static('public'));

// app.use(express.text()); //for content-type: plain/text
app.use(express.urlencoded({ extended: true })); //for content-type: application/x-www-form-urlencoded
// app.use(express.json()); //for content-type: application/json

app.post('/user', (req, res) => {
  req.on('data', (chunk) => {
    console.log('Reading Chunks');
    console.log(req.headers['content-type']);
    console.log(decodeURIComponent(chunk.toString()));
  });
  console.log({ body: req.body });

  res.json({ message: 'Got Data' });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
