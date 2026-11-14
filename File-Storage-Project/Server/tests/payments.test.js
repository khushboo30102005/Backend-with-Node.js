// Run with: npm test   (Node's built-in test runner, no extra dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import {
  hmacSha256Hex,
  safeEqual,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../utils/paymentCrypto.js';
import { getPremiumPlan, getFreePlan, GIB, planHasFeature } from '../config/plans.js';

const ENV_KEYS = [
  'PREMIUM_PRICE_INR',
  'PREMIUM_STORAGE_GB',
  'PREMIUM_DURATION_DAYS',
  'FREE_STORAGE_BYTES',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
];
function withEnv(vars, fn) {
  const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  Object.assign(process.env, vars);
  const restore = () => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  };
  try {
    const r = fn();
    return r instanceof Promise ? r.finally(restore) : (restore(), r);
  } catch (e) {
    restore();
    throw e;
  }
}

test('Free plan keeps the existing 1 GiB limit by default', () => {
  withEnv({}, () => assert.equal(getFreePlan().storageBytes, 1 * GIB));
});

test('Premium is unavailable until price and storage are configured', () => {
  withEnv({}, () => {
    const p = getPremiumPlan();
    assert.equal(p.available, false);
    assert.equal(p.durationDays, 30);
  });
  withEnv({ PREMIUM_PRICE_INR: '99' }, () =>
    assert.equal(getPremiumPlan().available, false),
  );
});

test('Premium price and storage are read from the environment (paise, bytes)', () => {
  withEnv({ PREMIUM_PRICE_INR: '149.5', PREMIUM_STORAGE_GB: '10' }, () => {
    const p = getPremiumPlan();
    assert.equal(p.available, true);
    assert.equal(p.pricePaise, 14950);
    assert.equal(p.storageBytes, 10 * GIB);
    assert.equal(p.durationDays, 30);
  });
  withEnv(
    { PREMIUM_PRICE_INR: '99', PREMIUM_STORAGE_GB: '5', PREMIUM_DURATION_DAYS: '45' },
    () => assert.equal(getPremiumPlan().durationDays, 45),
  );
});

test('Premium must be larger than Free and price at least ₹1', () => {
  withEnv({ PREMIUM_PRICE_INR: '99', PREMIUM_STORAGE_GB: '1' }, () =>
    assert.equal(getPremiumPlan().available, false),
  );
  withEnv({ PREMIUM_PRICE_INR: '0.5', PREMIUM_STORAGE_GB: '5' }, () =>
    assert.equal(getPremiumPlan().available, false),
  );
  withEnv({ PREMIUM_PRICE_INR: 'abc', PREMIUM_STORAGE_GB: '-3' }, () =>
    assert.equal(getPremiumPlan().available, false),
  );
});

test('feature flags are empty for now (storage-only Premium)', () => {
  assert.equal(planHasFeature('premium', 'anything'), false);
});

test('checkout signature: valid, tampered and malformed inputs', () => {
  const secret = 'test_secret';
  const sig = hmacSha256Hex(secret, 'order_ABC123|pay_XYZ789');
  const ok = { orderId: 'order_ABC123', paymentId: 'pay_XYZ789', signature: sig, secret };
  assert.equal(verifyCheckoutSignature(ok), true);
  assert.equal(verifyCheckoutSignature({ ...ok, paymentId: 'pay_OTHER1' }), false);
  assert.equal(verifyCheckoutSignature({ ...ok, orderId: 'order_OTHER1' }), false);
  assert.equal(verifyCheckoutSignature({ ...ok, secret: 'wrong' }), false);
  assert.equal(verifyCheckoutSignature({ ...ok, signature: sig.slice(0, -1) }), false);
  assert.equal(verifyCheckoutSignature({ ...ok, signature: '' }), false);
  assert.equal(verifyCheckoutSignature({ ...ok, secret: '' }), false);
});

test('webhook signature covers the exact raw bytes', () => {
  const secret = 'whsec';
  const body = Buffer.from('{"event":"payment.captured"}');
  const sig = hmacSha256Hex(secret, body);
  assert.equal(verifyWebhookSignature(body, sig, secret), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.captured" }'), sig, secret), false);
  assert.equal(verifyWebhookSignature(body, sig, 'other'), false);
  assert.equal(verifyWebhookSignature(body, undefined, secret), false);
  assert.equal(verifyWebhookSignature(body.toString(), sig, secret), false); // must be a Buffer
});

test('safeEqual handles differing lengths and non-strings', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual(null, 'abc'), false);
});

// --- the real webhook route, with the same raw-body mounting as app.js. -----
// These cases are all rejected before any database access, so no DB is needed.
async function startWebhookServer() {
  const { handleWebhook } = await import('../controllers/paymentController.js');
  const app = express();
  app.post('/payments/webhook', express.raw({ type: () => true, limit: '256kb' }), handleWebhook);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  return { server, url: `http://127.0.0.1:${server.address().port}/payments/webhook` };
}

test('webhook: 503 when RAZORPAY_WEBHOOK_SECRET is not configured', async () => {
  await withEnv({}, async () => {
    const { server, url } = await startWebhookServer();
    try {
      const res = await fetch(url, { method: 'POST', body: '{}' });
      assert.equal(res.status, 503);
    } finally {
      server.close();
    }
  });
});

test('webhook: rejects missing or wrong signatures with 400', async () => {
  await withEnv({ RAZORPAY_WEBHOOK_SECRET: 'whsec' }, async () => {
    const { server, url } = await startWebhookServer();
    try {
      const body = JSON.stringify({ event: 'payment.captured', payload: {} });
      const none = await fetch(url, { method: 'POST', body });
      assert.equal(none.status, 400);
      const bad = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'x-razorpay-signature': crypto.randomBytes(32).toString('hex') },
      });
      assert.equal(bad.status, 400);
    } finally {
      server.close();
    }
  });
});

test('webhook: a validly signed but malformed body is rejected with 400', async () => {
  await withEnv({ RAZORPAY_WEBHOOK_SECRET: 'whsec' }, async () => {
    const { server, url } = await startWebhookServer();
    try {
      const body = 'not json';
      const res = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'x-razorpay-signature': hmacSha256Hex('whsec', Buffer.from(body)) },
      });
      assert.equal(res.status, 400);
    } finally {
      server.close();
    }
  });
});

test('create order: 503 when Razorpay keys are missing (no order is created)', async () => {
  await withEnv({}, async () => {
    const { createOrder } = await import('../controllers/paymentController.js');
    const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await createOrder({ user: { _id: 'x' } }, res, (e) => { throw e; });
    assert.equal(res.code, 503);
  });
});

test('create order: 503 when Premium price/storage are not configured', async () => {
  await withEnv({ RAZORPAY_KEY_ID: 'rzp_test_x', RAZORPAY_KEY_SECRET: 's' }, async () => {
    const { createOrder } = await import('../controllers/paymentController.js');
    const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await createOrder({ user: { _id: 'x' } }, res, (e) => { throw e; });
    assert.equal(res.code, 503);
  });
});

test('verify: malformed payloads are rejected before any lookup', async () => {
  const { verifyPayment } = await import('../controllers/paymentController.js');
  for (const body of [{}, { razorpay_order_id: 'x', razorpay_payment_id: 'y', razorpay_signature: 'z' }]) {
    const res = { code: 0, status(c) { this.code = c; return this; }, json() { return this; } };
    await verifyPayment({ body, user: { _id: 'x' } }, res, (e) => { throw e; });
    assert.equal(res.code, 400);
  }
});

test('refund total: partial refunds that add up to the full amount count as full', async () => {
  const { refundedTotal } = await import('../controllers/paymentController.js');
  const refund = (amount) => ({ payment_id: 'pay_ABC123', amount });

  // Second of two ₹49.50 refunds on a ₹99 payment: running total is 9900.
  assert.equal(refundedTotal(refund(4950), { id: 'pay_ABC123', amount_refunded: 9900 }), 9900);
  // First partial refund: running total is still below the full amount.
  assert.equal(refundedTotal(refund(4950), { id: 'pay_ABC123', amount_refunded: 4950 }), 4950);
  // No payment entity in the payload: fall back to this refund's amount.
  assert.equal(refundedTotal(refund(9900), undefined), 9900);
  // Payment entity for a different payment is ignored.
  assert.equal(refundedTotal(refund(4950), { id: 'pay_OTHER1', amount_refunded: 9900 }), 4950);
  // Garbage input never throws.
  assert.equal(refundedTotal(undefined, undefined), 0);
});
