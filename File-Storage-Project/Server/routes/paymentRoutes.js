import express from 'express';
import { perUserLimiter } from '../middlewares/rateLimitMiddleware.js';
import {
  getStatus,
  createOrder,
  verifyPayment,
  reportFailure,
} from '../controllers/paymentController.js';

// Mounted in app.js behind checkAuth:  app.use('/payments', checkAuth, paymentRoutes);
// (The webhook is mounted separately in app.js, before the JSON body parser.)
const router = express.Router();

const orderLimiter = perUserLimiter({
  name: 'payment-order',
  limit: 10,
  message: 'Too many payment attempts. Please try again later.',
});
const confirmLimiter = perUserLimiter({
  name: 'payment-confirm',
  limit: 30,
  message: 'Too many requests. Please try again later.',
});

router.get('/status', getStatus);
router.post('/order', orderLimiter, createOrder);
router.post('/verify', confirmLimiter, verifyPayment);
router.post('/failed', confirmLimiter, reportFailure);

export default router;
