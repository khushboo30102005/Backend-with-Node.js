import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getStatus,
  createOrder,
  verifyPayment,
  reportFailure,
} from '../controllers/paymentController.js';

// Mounted in app.js behind checkAuth:  app.use('/payments', checkAuth, paymentRoutes);
// (The webhook is mounted separately in app.js, before the JSON body parser.)
const router = express.Router();

const perUser = (limit, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user._id),
    message: { error: message },
  });

const orderLimiter = perUser(10, 'Too many payment attempts. Please try again later.');
const confirmLimiter = perUser(30, 'Too many requests. Please try again later.');

router.get('/status', getStatus);
router.post('/order', orderLimiter, createOrder);
router.post('/verify', confirmLimiter, verifyPayment);
router.post('/failed', confirmLimiter, reportFailure);

export default router;
