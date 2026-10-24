import express from 'express';
import {
  loginWithGoogle,
  sendOTP,
  setPasswordWithOtp,
  verifyLoginOTP,
  verifyOTP,
} from '../controllers/authController.js';
import { authLimiter, otpSendLimiter } from '../middlewares/rateLimitMiddleware.js';
import { sessionCookieOptions } from '../config/cookie.js';

const router = express.Router();

// Cookie capability probe. The test cookie uses the same SameSite/Secure
// settings as the real session cookie, so if the browser accepts this one it
// will accept the session cookie too. Step 1 sets it, step 2 reports whether
// the browser sent it back.
router.get('/cookie-test', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.cookie('cookie_test', '1', {
    ...sessionCookieOptions(5 * 60 * 1000),
    signed: false,
  });
  res.status(204).end();
});

router.get('/cookie-test/verify', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ enabled: req.cookies?.cookie_test === '1' });
});

router.post('/send-otp', otpSendLimiter, sendOTP);

router.post('/verify-otp', authLimiter, verifyOTP);

router.post('/google', authLimiter, loginWithGoogle);

router.post('/verify-login-otp', authLimiter, verifyLoginOTP);

router.post('/set-password', authLimiter, setPasswordWithOtp);

export default router;
