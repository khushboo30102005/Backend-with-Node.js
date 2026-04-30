import express from 'express';

const app = express();

app.get('/directory', (req, res) => {
  // 1 way
  /*   res.set({
    location: '/folder',
  });
  res.status(301).end(); */

  // 2nd way
/*   res.writeHead(301, {
    location: '/folder',
  });
  res.end();
 */
  // 3rd way: By express
  res.redirect(301, 'https://procodrr.com/')
});
app.get('/folder', (req, res) => {
  res.json({
    name: 'images',
    files: ['Node.png', 'js.webp'],
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
