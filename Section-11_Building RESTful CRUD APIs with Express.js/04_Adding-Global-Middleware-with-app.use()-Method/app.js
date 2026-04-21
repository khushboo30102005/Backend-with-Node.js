import express from 'express';

const app = express();

const port = 4000;

// Global Middleware: GMW defined with app.use()
// It run for every request

// If any middleware match before GMW than, it will be ignore.

app.get('/user', (req, res) => {
  console.log(req.url);
  res.end('KHUSHBOO SAINI');
});

// GLOBAL MIDDLEWARE =>
/*   // Manually
app.use((req, res, next) => {
  req.on('data', (chunk) => {
    const reqBody = JSON.parse(chunk.toString());
    req.body = reqBody;
    console.log(req.body);
    next();
  }); */

// Using express:
app.use(express.json());

// What is exactly middleware here: return value of express.json()

app.post('/user', (req, res) => {
  res.end('POST KHUSHBOO SAINI');
  console.log(req.body)

  /*   // res.end('Global middleware')
  res.write('GMW is running......');
  console.log(req.headers); 
  console.log(req.url);
  next(); */
});

app.get('/', (req, res) => {
  res.end('HOME ROUTE');
});

app.get('/login', (req, res) => {
  console.log(req.url);
  res.end('LOGIN ROUTE');
});

app.listen(port);
