import express from 'express';

const app = express();

const port = 4000;
/* 
app.get('/directory', (req, res) => {
  res.json("Hii from REgex");
});
app.get('/folder', (req, res) => {
  res.json("Hii from REgex");
}); */

// If different routes are return same response, here we can use REGEX in string:
/* 
app.get('/directory|folder', (req, res) => {
  res.json("Hii from REgex");
}); */

// Alternate of this regex method for prevent  ReDoS Attack
// Using Array to define multiple routes:
// We can also add here REGex
app.get(['/directory', '/folder', '/test', '/hii', /^\/(\d+)$/], (req, res) => {
  res.json('Hii from REgex');
});

// Another example of REgex
/* app.get('/:id([0-9])', (req, res) => {
  res.json("Hii from REgex");
}); */
// app.get(/^\/(\d+)$/, (req, res) => {
//   res.json({ double: req.params[0] * 2 });
// });

app.listen(port, () => {
  console.log('Sever Started>');
});
