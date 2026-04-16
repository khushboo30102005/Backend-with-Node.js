import express from 'express';

const app = express();

const port = 4000;

// What is middleware: Middle layer between incoming and outgoing requests  called middlewares in expressJs.
// The handler functions that are passes in app.get() function.

// arguments of middleware: req, res, next

// req: readable stream

//res: writable stream

// next: nextFunction that allow next middleware to run

// Middlewares are stored in an array behind the scene

// Types of middlewares: 2

// 1. Request handler middleware: it has either 2 params or 3 params , it handles requests

// 2. Error handler middleware : it handles errors, it has one extra param that is error as 1st argument
// error handler middleware is call when an error occurs
// it can call automatically
// we can also call it by passing error or a truthy value in nextFunction
// if we call next with falsy values or empty (without any params), this error middleware will be ignored and next request middleware will be execute if available.

app.get(
  '/',
  (req, res, next) => {
    // Request handler middleware  - 3 params

    // call manually
     try {
      console.log('MiddleWare is running   1');
      res.write('Hello Middleware..1\n');
      throw new Error('Error');
    } catch (err) {
      next(err);
    }
    //  call automatically
    // throw new Error('hii')
    // console.log(object)
    next(); // calling nextFunction
  },
  (err, req, res, next) => {
    console.log('Error MiddleWare is running\tFound error');
    console.log({ err: err.message });
    // res.write('Found error \n');
  },
  // Request handler middleware  - 2 params
  (req, res) => {
    console.log('MiddleWare is running   2');
    res.end('Hello Middleware..2\n');
  },
);

app.listen(port);
