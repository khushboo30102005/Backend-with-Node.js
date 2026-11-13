import { axiosWithCreds } from './axiosInstances';

// Plans, current subscription, storage and payment history for the signed-in user.
export const getPaymentStatus = async () => {
  const { data } = await axiosWithCreds.get('/payments/status');
  return data;
};

// The server decides the amount and plan; nothing about price is sent.
export const createPremiumOrder = async () => {
  const { data } = await axiosWithCreds.post('/payments/order');
  return data;
};

// Sends Razorpay's response to the server, which verifies the signature.
export const verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const { data } = await axiosWithCreds.post('/payments/verify', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return data;
};

// Informational only (cancelled / failed attempts); never grants anything.
export const reportPaymentFailure = async (orderId, reason, description) => {
  const { data } = await axiosWithCreds.post('/payments/failed', {
    razorpay_order_id: orderId,
    reason,
    ...(description ? { description: String(description).slice(0, 200) } : {}),
  });
  return data;
};
