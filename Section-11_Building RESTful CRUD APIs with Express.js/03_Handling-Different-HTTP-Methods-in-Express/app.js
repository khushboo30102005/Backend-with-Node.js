import express from 'express';

const app = express();

const port = 4000;


app.get('/', (req, res) => {
  res.end('HOME ROUTE')
})

app.get('/login', (req, res) => {
  res.end('LOGGED IN')
})

app.post('/', (req, res) => {
  res.end('POST HOME ROUTE')
})

app.put('/', (req, res) => {
  res.end('DELETE REQUEST....')
})

app.patch('/', (req, res) => {
  res.end('PATCH REQUEST...')
})

app.delete('/', (req, res) => {
  res.end('DELETE REQUEST...')
})

app.head('/', (req, res) => {
  res.setHeader('abc', 'efg')
})

app.options('/', (req, res) => {
  res.end('OPTION REQUEST...')
})


app.listen(port);
