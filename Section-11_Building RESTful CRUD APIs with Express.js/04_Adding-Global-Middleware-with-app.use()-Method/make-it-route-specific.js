import express from 'express';

const app = express();

const port = 4000;

// How to app.use() register
// IN this case express matches url and routeName level by level from starting of routeName

// Something like startWith() method of js but not exactly, it checks one level at a time not only one char.

// req.url.startsWith(req.route.path)
// '/users'.startsWith('/users')   -> true
// '/users/1'.startsWith('/users')   -> true

// bodyParser that parse incoming json
app.use(express.json());

app.use('/users/1', (req, res) => {
  console.log({"url" :req.url})   //{ url: '/' }
  res.end('second Middleware');
});

app.use('/users', (req, res) => {
  res.end('First Middleware');
});

// if req.url = "/admin/khushboo" , in middleware of app.use() express trims routeName  and make it "/khushboo"
app.use('/admin', (req, res, next) => {
  console.log(req.url); //    /   -> Express trims url that match in app.use() , generally here url is the above part of route 
  console.log(req.originalUrl); //     /admin
  if (req.body.password === 'secret' && req.body.name === 'Khushboo saini') {
    next();
  } else {
    res.end('Invalid Credentials');
  }
});

app.post('/admin', (req, res) => {
  res.end('HELLO ADMIN.....');
});
//  How get, post, put,..etc. are registers:
//  express matches URL and ROUTEnAME strictly and than allow to run middleware that define inside these methods.
//  req.url === req.route.path
//  '/' === '/'
app.get('/', (req, res) => {
  res.end('HOME ROUTE');
});

app.get('/login', (req, res) => {
  res.end('LOGIN ROUTE');
});

app.listen(port);
