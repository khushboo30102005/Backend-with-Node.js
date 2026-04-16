import express from 'express';

const app = express();

const port = 4000;

// url => req.url
// req.url is the requested path + query string sent by the client.
// Example: http://localhost:3000/users?id=5
// Here req.url is : "/users?id=5"
// Using URL, the client sends a request to the server

// route => req.route.path
// A rout is a path defined on server to handle requests.
// To handle client's request URL we define specific routes on the server.
// Example: '/test'
app.get('/test', (req, res) => {
  console.log(req.url); //   /test
  console.log(req.route.path); //   /test
  res.end('TEST ROUTE');
});

app.listen(port);
