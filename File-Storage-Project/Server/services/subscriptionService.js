import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Payment from '../models/paymentModel.js';
import Subscription from '../models/subscriptionModel.js';
import { DAY_MS } from '../config/plans.js';

const SWEEP_INTERVAL_MS =
  (Number(process.env.SUBSCRIPTION_SWEEP_SECONDS) || 300) * 1000;

// ---------------------------------------------------------------------------
// Redis sessions cache maxStorageInBytes. After any plan change we rewrite it
// in the user's live sessions. This is best-effort: uploads and the storage
// views read the limit from MongoDB (getEffectiveStorageLimit), so a failed
// sync can never grant or withhold space, it only delays the cached copy.
// ---------------------------------------------------------------------------
export async function syncUserSessions(userId, maxStorageInBytes) {
  try {
    const { default: redisClient } = await import('../config/redis.js');
    const found = await redisClient.ft.search(
      'userIdIdx',
      `@userId:{${String(userId)}}`,
      { RETURN: [], LIMIT: { from: 0, size: 100 } },
    );
    await Promise.all(
      found.documents.map((d) =>
        redisClient.json.set(d.id, '$.maxStorageInBytes', maxStorageInBytes),
      ),
    );
  } catch (err) {
    console.error('[subscription] session sync failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Activation. Called by BOTH the verified checkout callback and the webhook,
// so it must be safe to run any number of times, concurrently, for the same
// order. The conditional update of the payment document is the idempotency
// gate: only the single call that flips it to "paid" grants time; every other
// call is a no-op.
// ---------------------------------------------------------------------------
export async function activatePremiumFromPayment({ orderId, paymentId, via }) {
  const mongoSession = await mongoose.startSession();
  let outcome = { activated: false };
  try {
    await mongoSession.withTransaction(async () => {
      outcome = { activated: false }; // the callback can be retried by the driver
      const now = new Date();

      const payment = await Payment.findOneAndUpdate(
        {
          razorpayOrderId: orderId,
          status: { $in: ['created', 'failed', 'cancelled'] },
        },
        {
          $set: {
            status: 'paid',
            razorpayPaymentId: paymentId,
            paidAt: now,
            verifiedVia: via,
          },
          $unset: { failureReason: '' },
        },
        { new: true, session: mongoSession },
      );
      if (!payment) return; // already paid, refunded, or unknown: nothing to grant

      const user = await User.findById(payment.userId).session(mongoSession);
      if (!user) {
        outcome = { activated: false, reason: 'user_missing' };
        return;
      }

      const sub = await Subscription.findOne({ userId: user._id }).session(
        mongoSession,
      );
      const hasActiveRecord = sub && sub.status === 'active';
      const stillRunning = hasActiveRecord && sub.expiresAt > now;

      // Buying again while Premium is running adds time after the current end.
      const startFrom = stillRunning ? sub.expiresAt : now;
      const expiresAt = new Date(startFrom.getTime() + payment.durationDays * DAY_MS);
      const base = hasActiveRecord ? sub.baseStorageInBytes : user.maxStorageInBytes;
      // Never reduce a limit an admin already set above the Premium size.
      const newLimit = Math.max(base, payment.storageBytes);

      await Subscription.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            plan: 'premium',
            status: 'active',
            startedAt: stillRunning ? sub.startedAt : now,
            expiresAt,
            baseStorageInBytes: base,
            premiumStorageInBytes: newLimit,
            lastPaymentId: payment._id,
          },
        },
        { upsert: true, session: mongoSession },
      );
      await User.updateOne(
        { _id: user._id },
        { $set: { maxStorageInBytes: newLimit } },
        { session: mongoSession },
      );

      outcome = {
        activated: true,
        userId: user._id,
        maxStorageInBytes: newLimit,
        expiresAt,
      };
    });
  } finally {
    await mongoSession.endSession();
  }

  if (outcome.activated) {
    await syncUserSessions(outcome.userId, outcome.maxStorageInBytes);
    return outcome;
  }

  // Already processed (for example the webhook arrived after the checkout
  // callback). Re-sync the cached sessions in case the first attempt's sync
  // failed; it's idempotent.
  const existing = await Payment.findOne({ razorpayOrderId: orderId }).lean();
  if (existing?.status === 'paid') {
    const user = await User.findById(existing.userId).select('maxStorageInBytes').lean();
    if (user) await syncUserSessions(existing.userId, user.maxStorageInBytes);
    return { ...outcome, alreadyProcessed: true, userId: existing.userId };
  }
  return outcome;
}

// ---------------------------------------------------------------------------
// Expiry. The status flip and the limit restore happen in one transaction.
// ---------------------------------------------------------------------------
async function expireSubscription(subId) {
  const mongoSession = await mongoose.startSession();
  let result = null;
  try {
    await mongoSession.withTransaction(async () => {
      result = null;
      const sub = await Subscription.findOneAndUpdate(
        { _id: subId, status: 'active', expiresAt: { $lte: new Date() } },
        { $set: { status: 'expired' } },
        { new: true, session: mongoSession },
      );
      if (!sub) return;
      await User.updateOne(
        { _id: sub.userId },
        { $set: { maxStorageInBytes: sub.baseStorageInBytes } },
        { session: mongoSession },
      );
      result = { userId: sub.userId, maxStorageInBytes: sub.baseStorageInBytes };
    });
  } finally {
    await mongoSession.endSession();
  }
  if (result) await syncUserSessions(result.userId, result.maxStorageInBytes);
  return Boolean(result);
}

// Downgrades one user if their Premium has run out. Cheap (one indexed read)
// so it can run on the request path.
export async function expireIfDue(userId) {
  const due = await Subscription.findOne({
    userId,
    status: 'active',
    expiresAt: { $lte: new Date() },
  })
    .select('_id')
    .lean();
  if (due) await expireSubscription(due._id);
}

export async function expireDueSubscriptions() {
  const due = await Subscription.find({
    status: 'active',
    expiresAt: { $lte: new Date() },
  })
    .select('_id')
    .limit(200)
    .lean();
  let count = 0;
  for (const s of due) if (await expireSubscription(s._id)) count += 1;
  return count;
}

export function startSubscriptionSweeper() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const n = await expireDueSubscriptions();
      if (n) console.log(`[subscription] expired ${n} subscription(s)`);
    } catch (err) {
      console.error('[subscription] sweep failed:', err.message);
    } finally {
      running = false;
    }
  };
  tick(); // catch up right after a restart / wake from sleep
  setInterval(tick, SWEEP_INTERVAL_MS).unref();
}

// ---------------------------------------------------------------------------
// The authoritative storage limit. Always read from MongoDB (never from the
// cached session) after applying any pending expiry.
// ---------------------------------------------------------------------------
export async function getEffectiveStorageLimit(userId) {
  await expireIfDue(userId);
  const user = await User.findById(userId).select('maxStorageInBytes').lean();
  return user?.maxStorageInBytes ?? 0;
}

// ---------------------------------------------------------------------------
// Refunds. A full refund takes back the time that payment granted.
// ---------------------------------------------------------------------------
export async function revokePremiumForRefund(orderId) {
  const mongoSession = await mongoose.startSession();
  let result = null;
  try {
    await mongoSession.withTransaction(async () => {
      result = null;
      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: 'paid' },
        { $set: { status: 'refunded', refundedAt: new Date() } },
        { new: true, session: mongoSession },
      );
      if (!payment) return;

      const sub = await Subscription.findOne({ userId: payment.userId }).session(
        mongoSession,
      );
      if (!sub || sub.status !== 'active') {
        result = { userId: payment.userId, revoked: false };
        return;
      }
      const reduced = new Date(sub.expiresAt.getTime() - payment.durationDays * DAY_MS);
      if (reduced <= new Date()) {
        await Subscription.updateOne(
          { _id: sub._id },
          { $set: { status: 'revoked', expiresAt: new Date() } },
          { session: mongoSession },
        );
        await User.updateOne(
          { _id: sub.userId },
          { $set: { maxStorageInBytes: sub.baseStorageInBytes } },
          { session: mongoSession },
        );
        result = {
          userId: sub.userId,
          revoked: true,
          maxStorageInBytes: sub.baseStorageInBytes,
        };
      } else {
        await Subscription.updateOne(
          { _id: sub._id },
          { $set: { expiresAt: reduced } },
          { session: mongoSession },
        );
        result = { userId: sub.userId, revoked: false };
      }
    });
  } finally {
    await mongoSession.endSession();
  }
  if (result?.revoked) await syncUserSessions(result.userId, result.maxStorageInBytes);
  return result;
}

// ---------------------------------------------------------------------------
// Read model for the UI.
// ---------------------------------------------------------------------------
export async function getSubscriptionSummary(userId) {
  await expireIfDue(userId);
  const sub = await Subscription.findOne({ userId }).lean();
  const now = Date.now();
  const active = Boolean(sub && sub.status === 'active' && sub.expiresAt.getTime() > now);
  return {
    plan: active ? 'premium' : 'free',
    status: active ? 'active' : sub ? sub.status : 'free',
    startedAt: sub?.startedAt ?? null,
    expiresAt: active ? sub.expiresAt : (sub?.expiresAt ?? null),
    daysLeft: active ? Math.max(1, Math.ceil((sub.expiresAt.getTime() - now) / DAY_MS)) : 0,
  };
}
