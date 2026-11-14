import express from 'express';
import {
  loginWithGoogle,
  sendOTP,
  setPasswordWithOtp,
  verifyLoginOTP,
  verifyOTP,
} from '../controllers/authController.js';
import { authLimiter, otpSendLimiter } from '../middlewares/rateLimitMiddleware.js';
import {
  sendOtpRateLimit,
  verifyOtpRateLimit,
} from '../middlewares/otpRateLimitMiddleware.js';

const router = express.Router();

// The cookie probe (/auth/cookie-test) lives in cookieProbeRoutes.js and is
// mounted ahead of the global API limiter in app.js.

router.post('/send-otp', otpSendLimiter, sendOtpRateLimit, sendOTP);

router.post('/verify-otp', authLimiter, verifyOtpRateLimit, verifyOTP);

router.post('/google', authLimiter, loginWithGoogle);

router.post('/verify-login-otp', authLimiter, verifyOtpRateLimit, verifyLoginOTP);

router.post('/set-password', authLimiter, verifyOtpRateLimit, setPasswordWithOtp);

export default router;
