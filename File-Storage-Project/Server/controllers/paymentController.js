import crypto from 'crypto';
import * as z from 'zod';
import User from '../models/userModel.js';
import Payment from '../models/paymentModel.js';
import Directory from '../models/directoryModel.js';
import WebhookEvent from '../models/webhookEventModel.js';
import { getFreePlan, getPremiumPlan, CURRENCY } from '../config/plans.js';
import { getRazorpay, getKeyId, getKeySecret, isRazorpayConfigured } from '../config/razorpay.js';
import { verifyCheckoutSignature, verifyWebhookSignature } from '../utils/paymentCrypto.js';
import {
  activatePremiumFromPayment,
  getSubscriptionSummary,
  revokePremiumForRefund,
} from '../services/subscriptionService.js';

const orderIdSchema = z.string().regex(/^order_[A-Za-z0-9]{6,40}$/);
const paymentIdSchema = z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/);

const verifySchema = z.object({
  razorpay_order_id: orderIdSchema,
  razorpay_payment_id: paymentIdSchema,
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

const failureSchema = z.object({
  razorpay_order_id: orderIdSchema,
  reason: z.enum(['cancelled', 'failed']),
  description: z.string().max(200).optional(),
});

const publicPlan = (p) => ({
  id: p.id,
  name: p.name,
  available: p.available,
  currency: p.currency,
  pricePaise: p.pricePaise,
  storageBytes: p.storageBytes,
  ...(p.durationDays ? { durationDays: p.durationDays } : {}),
});

// Strip anything that is not plain text before it is stored or shown.
const cleanText = (s = '') =>
  String(s).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);

// ---------------------------------------------------------------------------
// GET /payments/status — plan, subscription, storage and payment history.
// ---------------------------------------------------------------------------
export const getStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subscription = await getSubscriptionSummary(userId);
    const [user, rootDir, payments] = await Promise.all([
      User.findById(userId).select('maxStorageInBytes').lean(),
      Directory.findById(req.user.rootDirId).select('size').lean(),
      Payment.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    return res.json({
      paymentsEnabled: isRazorpayConfigured(),
      plans: { free: publicPlan(getFreePlan()), premium: publicPlan(getPremiumPlan()) },
      subscription,
      storage: { max: user?.maxStorageInBytes ?? 0, used: rootDir?.size ?? 0 },
      payments: payments.map((p) => ({
        id: String(p._id),
        orderId: p.razorpayOrderId,
        paymentId: p.razorpayPaymentId || null,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        durationDays: p.durationDays,
        createdAt: p.createdAt,
        paidAt: p.paidAt || null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /payments/order — the amount, plan and size are decided here, never by
// the client. The browser only receives what Razorpay Checkout needs.
// ---------------------------------------------------------------------------
export const createOrder = async (req, res, next) => {
  try {
    const razorpay = getRazorpay();
    const premium = getPremiumPlan();
    if (!razorpay) {
      return res.status(503).json({ error: 'Payments are not available yet.' });
    }
    if (!premium.available) {
      console.error('[payments] Premium not configured:', premium.unavailableReason);
      return res.status(503).json({ error: 'Premium is not available yet.' });
    }

    const user = await User.findById(req.user._id).select('name email isDeleted').lean();
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'User not found or account is unavailable.' });
    }

    const receipt = `sa_${crypto.randomBytes(10).toString('hex')}`; // ≤ 40 chars
    let order;
    try {
      order = await razorpay.orders.create({
        amount: premium.pricePaise,
        currency: CURRENCY,
        receipt,
        notes: { userId: String(req.user._id), plan: premium.id },
      });
    } catch (err) {
      console.error('[payments] order creation failed:', err?.error?.description || err.message);
      return res.status(502).json({ error: 'Could not start the payment. Please try again.' });
    }

    await Payment.create({
      userId: req.user._id,
      razorpayOrderId: order.id,
      receipt,
      plan: premium.id,
      amount: premium.pricePaise,
      currency: CURRENCY,
      durationDays: premium.durationDays,
      storageBytes: premium.storageBytes,
    });

    return res.status(201).json({
      orderId: order.id,
      amount: premium.pricePaise,
      currency: CURRENCY,
      keyId: getKeyId(), // public key id only
      name: 'StorageApp',
      description: `${premium.name} — ${premium.durationDays} days`,
      prefill: { name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /payments/verify — called by the browser after Checkout succeeds.
// Success is decided by the signature plus Razorpay's own record of the
// payment, never by the browser saying "it worked".
// ---------------------------------------------------------------------------
export const verifyPayment = async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payment details.' });
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = parsed.data;

    const payment = await Payment.findOne({
      razorpayOrderId: orderId,
      userId: req.user._id, // a user can only verify their own orders
    }).lean();
    if (!payment) return res.status(404).json({ error: 'Order not found.' });

    if (!verifyCheckoutSignature({ orderId, paymentId, signature, secret: getKeySecret() })) {
      console.warn('[payments] signature mismatch for order', orderId);
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    // Already activated (double click, retry, or the webhook got here first).
    if (payment.status === 'paid') {
      const result = await activatePremiumFromPayment({ orderId, paymentId, via: 'checkout' });
      const subscription = await getSubscriptionSummary(req.user._id);
      return res.json({ status: 'paid', duplicate: true, subscription, result: Boolean(result) });
    }
    if (payment.status === 'refunded') {
      return res.status(409).json({ error: 'This payment was refunded.' });
    }

    // Cross-check with Razorpay: same order, same amount, actually captured.
    const razorpay = getRazorpay();
    let rp;
    try {
      rp = await razorpay.payments.fetch(paymentId);
      if (rp.status === 'authorized') {
        rp = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
      }
    } catch (err) {
      console.error('[payments] could not confirm payment:', err?.error?.description || err.message);
      return res.status(502).json({
        error:
          'We could not confirm the payment with Razorpay yet. If you were charged, your plan will activate automatically shortly.',
      });
    }
    if (
      rp.order_id !== orderId ||
      Number(rp.amount) !== payment.amount ||
      rp.currency !== payment.currency
    ) {
      console.error('[payments] payment/order mismatch', orderId, paymentId);
      return res.status(400).json({ error: 'Payment verification failed.' });
    }
    if (rp.status !== 'captured') {
      if (rp.status === 'failed') {
        await Payment.updateOne(
          { _id: payment._id, status: 'created' },
          { $set: { status: 'failed', failureReason: 'payment_failed' } },
        );
      }
      return res.status(402).json({ error: 'The payment was not completed.' });
    }

    await activatePremiumFromPayment({ orderId, paymentId, via: 'checkout' });
    const subscription = await getSubscriptionSummary(req.user._id);
    return res.json({ status: 'paid', subscription });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /payments/failed — the browser reports a cancelled or failed attempt.
// This is informational only: it can never grant anything, and it cannot
// touch an order that is already paid. (A retry on the same order can still
// succeed later and be activated.)
// ---------------------------------------------------------------------------
export const reportFailure = async (req, res, next) => {
  try {
    const parsed = failureSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request.' });
    const { razorpay_order_id: orderId, reason, description } = parsed.data;
    await Payment.updateOne(
      { razorpayOrderId: orderId, userId: req.user._id, status: 'created' },
      { $set: { status: reason, failureReason: cleanText(description) || reason } },
    );
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /payments/webhook — mounted in app.js BEFORE express.json() with a raw
// body parser, because the signature covers the exact bytes Razorpay sent.
// ---------------------------------------------------------------------------
// Total refunded so far on a payment, in paise. Uses the payment's running
// total (amount_refunded) so several partial refunds that add up to the full
// amount still count as a full refund. Falls back to this refund's own amount
// if the payment entity is missing or belongs to a different payment.
export function refundedTotal(refund, paymentEntity) {
  if (
    paymentEntity?.id === refund?.payment_id &&
    paymentEntity?.amount_refunded != null
  ) {
    return Number(paymentEntity.amount_refunded);
  }
  return Number(refund?.amount) || 0;
}

async function processWebhookEvent(evt) {
  const entity = evt?.payload?.payment?.entity;

  switch (evt.event) {
    case 'payment.captured':
    case 'order.paid': {
      if (!entity?.order_id || !entity?.id) return;
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id }).lean();
      if (!payment) return; // not an order created by this app
      if (
        Number(entity.amount) !== payment.amount ||
        entity.currency !== payment.currency ||
        entity.status !== 'captured'
      ) {
        console.error('[payments] webhook payment mismatch', entity.order_id);
        return;
      }
      await activatePremiumFromPayment({
        orderId: entity.order_id,
        paymentId: entity.id,
        via: 'webhook',
      });
      return;
    }
    case 'payment.failed': {
      if (!entity?.order_id) return;
      await Payment.updateOne(
        { razorpayOrderId: entity.order_id, status: 'created' },
        {
          $set: {
            status: 'failed',
            failureReason: cleanText(entity.error_description) || 'payment_failed',
          },
        },
      );
      return;
    }
    case 'refund.processed': {
      const refund = evt?.payload?.refund?.entity;
      if (!refund?.payment_id) return;
      const payment = await Payment.findOne({ razorpayPaymentId: refund.payment_id }).lean();
      if (!payment) return;
      if (refundedTotal(refund, entity) >= payment.amount) {
        await revokePremiumForRefund(payment.razorpayOrderId);
      } else {
        console.warn('[payments] partial refund (not yet full) for', payment.razorpayOrderId);
      }
      return;
    }
    default:
      return; // other events are acknowledged and ignored
  }
}

export const handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured yet: do not process anything unauthenticated.
    return res.status(503).json({ error: 'Webhook is not configured.' });
  }
  const raw = req.body;
  if (!Buffer.isBuffer(raw) || raw.length === 0) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  if (!verifyWebhookSignature(raw, req.get('x-razorpay-signature'), secret)) {
    console.warn('[payments] webhook signature rejected');
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  let evt;
  try {
    evt = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid payload.' });
  }

  // Razorpay retries with the same event id; fall back to a body hash.
  const eventId =
    req.get('x-razorpay-event-id') ||
    crypto.createHash('sha256').update(raw).digest('hex');

  try {
    await WebhookEvent.create({ eventId, event: String(evt.event || 'unknown') });
  } catch (err) {
    if (err?.code === 11000) return res.status(200).json({ ok: true, duplicate: true });
    console.error('[payments] webhook dedupe failed:', err.message);
    return res.status(500).json({ error: 'Temporary error.' });
  }

  try {
    await processWebhookEvent(evt);
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Forget the event so Razorpay's retry is processed instead of skipped.
    await WebhookEvent.deleteOne({ eventId }).catch(() => {});
    console.error('[payments] webhook processing failed:', err.message);
    return res.status(500).json({ error: 'Temporary error.' });
  }
};
