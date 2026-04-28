import express from 'express';
const app = express();
const port = 4000;
import cors from 'cors'
import cookieParser from 'cookie-parser'

app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true
}))
app.use(cookieParser())
app.get('/', (req, res, next) => {
  console.log(req.headers.cookie);
  console.log(req.cookies.Name)
  // res.set({
  //   'Set-Cookie':[ `name='khushboo'; SameSite=None; Secure`,  `email='khushboo@gmail.com'; SameSite=None; Secure`,  `password='12345'; SameSite=None; Secure`],
  // });

  res.cookie('Name', "Khushboo", {
    sameSite: 'none',
    secure: true,
    maxAge: 60*1000*60
  })
  res.cookie('email', "khushboo@gmail.com", {
    sameSite: 'none',
    secure: true,
    maxAge: 60*1000*60
  })
  res.cookie('password', "Khushboo", {
    sameSite: 'none',
    secure: true,
    maxAge: 60*1000*60
  })
  res.json({ message: 'Hello World' });
});

app.listen(port, () => {
  console.log('Server Started>>>>');
});
