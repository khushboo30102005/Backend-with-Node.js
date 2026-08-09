import express from 'express';
import {
  loginWithGoogle,
  sendOTP,
  verifyLoginOTP,
  verifyOTP,
} from '../controllers/authController.js';

const router = express.Router();
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/google', loginWithGoogle);
router.post('/verify-login-otp', verifyLoginOTP);

export default router;
