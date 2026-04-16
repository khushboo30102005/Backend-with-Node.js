import express from 'express';
// console.log(express)

const app = express();

const port = 3000;

// disable useless headers:
app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.send('Hello world')
  // res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // res.end('Hello world😎')
})

app.listen(port, () => {
  console.log('Server started on: '+ port)
})