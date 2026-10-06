import express from 'express';
import {
  loginWithGoogle,
  sendOTP,
  setPasswordWithOtp,
  verifyLoginOTP,
  verifyOTP,
} from '../controllers/authController.js';
import { authLimiter, otpSendLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();
router.post('/send-otp', otpSendLimiter, sendOTP);

router.post('/verify-otp', authLimiter, verifyOTP);

router.post('/google', authLimiter, loginWithGoogle);

router.post('/verify-login-otp', authLimiter, verifyLoginOTP);

router.post('/set-password', authLimiter, setPasswordWithOtp);

export default router;
