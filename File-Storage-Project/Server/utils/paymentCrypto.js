import crypto from 'crypto';

export const hmacSha256Hex = (secret, data) =>
  crypto.createHmac('sha256', secret).update(data).digest('hex');

// Constant-time string comparison (also safe for different lengths).
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a, 'utf8');
  const B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

// Razorpay Checkout: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export function verifyCheckoutSignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  return safeEqual(hmacSha256Hex(secret, `${orderId}|${paymentId}`), String(signature));
}

// Webhooks: signature = HMAC_SHA256(raw request body, webhook secret)
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody) || !signature || !secret) return false;
  return safeEqual(hmacSha256Hex(secret, rawBody), String(signature));
}
