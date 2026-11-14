import express from 'express';
import { sessionCookieOptions } from '../config/cookie.js';

// Cookie capability probe used by the Login and Register pages before the
// user has signed in. The test cookie uses the same SameSite/Secure settings
// as the real session cookie, so if the browser accepts this one it will
// accept the session cookie too. Step 1 sets it, step 2 reports whether the
// browser sent it back.
//
// Mounted in app.js BEFORE the global API limiter, like /health: it touches no
// database, Redis or user data and only echoes a fixed cookie, so it gains
// nothing from throttling, while counting it let an exhausted shared bucket
// break the sign-in page with a 429 before the user had done anything.
const router = express.Router();

// Mounted at /auth/cookie-test.
router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.cookie('cookie_test', '1', {
    ...sessionCookieOptions(5 * 60 * 1000),
    signed: false,
  });
  res.status(204).end();
});

router.get('/verify', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ enabled: req.cookies?.cookie_test === '1' });
});

export default router;
