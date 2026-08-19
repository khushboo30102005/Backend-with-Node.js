import express from 'express';
import cookieParse from 'cookie-parser';
import { randomBytes } from 'crypto';

const app = express();
const PORT = 4000;
let amount = 10000;
const csrfTokens = {};

function csrfProtection(req, res, next) {
  if (!req.cookies.sid) {
    return res.send('You are not logged <br> <a href="/login">Login</a>');
  }

  if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
    const csrfToken = randomBytes(16).toString('hex');
    csrfTokens[req.cookies.sid] = csrfToken;
    req.csrfToken = csrfToken;
  }
  if (req.method === 'POST') {
    if (csrfTokens[req.cookies.sid] !== req.body.csrfToken) {
      return res.send('Invalid CSRF TOKEN.');
    }
  }
  next();
}

app.use(cookieParse());
app.use(express.urlencoded({ extended: false }));

// Middleware to set CSP
app.use((req, res, next) => {
  if (req.headers.accept?.includes('text/html')) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self';\
       frame-ancestors 'none'`,
    );
  }
  next();
});

// Serve dynamic HTML
app.get('/',csrfProtection,  (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bank App</title>
      <meta charset="UTF-8" />
    </head>
    <body>
      <h1>Amount: ₹<span id="amount">${amount}</span></h1>
      <form method="POST" action="/pay">
      <input name="csrfToken" value="${req.csrfToken}" hidden >
        <button type="submit">Pay</button>
      </form>
    </body>
    </html>
  `);
});

// Handle payment
app.post('/pay', csrfProtection, (req, res) => {
  amount -= 1000;
  res.redirect('/');
});

app.get('/login', (req, res) => {
  const sid = randomBytes(16).toString('hex');
  res.cookie('sid', sid, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 Visit http://localhost:${PORT}`);
});
