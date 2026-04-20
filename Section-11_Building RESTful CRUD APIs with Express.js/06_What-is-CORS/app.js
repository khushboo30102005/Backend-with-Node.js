import express from 'express';

const app = express();

const port = 4000;

app.use(express.static('test'));

// Enable CORS for all origins  using the cors middleware ny cors package:  npm install cors
//It's allow preflight request (OPTIONS) for PUT method, so we don't need to handle it manually.
import cors from 'cors';
// Enable CORS for all origins
// app.use(cors());

// Enable CORS for specific origins
/* app.use(cors({
  origin: "http://localhost:3000"
}));
 */
// Set origins for CORS manually:
// Manually set CORS headers to allow specific origins
// It's not allow preflight request (OPTIONS) for PUT method, so we need to handle it manually.

// app.use((req, res, next) => {
//   const origins = ['http://192.168.31.13:4000', 'http://127.0.0.1:5500'];
//   console.log(req.headers.origin);
//   if (origins.includes(req.headers.origin)) {
//     res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
//   }
//   next();
// });
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the GET request!' });
});

app.post('/api', (req, res) => {
  res.json({ message: 'Hello from the POST request!' });
});
app.put('/api', (req, res) => {
  res.json({ message: 'Hello from the PUT request!' });
});
app.patch('/api', (req, res) => {
  res.json({ message: 'Hello from the PATCH request!' });
});
app.delete('/api', (req, res) => {
  res.json({ message: 'Hello from the DELETE request!' });
});

app.listen(port, () => {
  console.log('server started');
});
