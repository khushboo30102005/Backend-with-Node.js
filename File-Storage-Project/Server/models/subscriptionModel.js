import { model, Schema } from 'mongoose';

// One document per user, created on the first purchase and reused afterwards.
// "Free" is simply the absence of an active subscription.
const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'User',
    },
    plan: { type: String, enum: ['premium'], default: 'premium' },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
    },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    // The user's storage limit before Premium; restored when Premium ends.
    baseStorageInBytes: { type: Number, required: true },
    premiumStorageInBytes: { type: Number, required: true },
    lastPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true, strict: 'throw' },
);

// Used by the expiry sweeper.
subscriptionSchema.index({ status: 1, expiresAt: 1 });

export default model('Subscription', subscriptionSchema);
