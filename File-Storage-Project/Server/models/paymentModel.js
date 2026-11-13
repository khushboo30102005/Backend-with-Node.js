import { model, Schema } from 'mongoose';

// Server-side record of every checkout attempt. The amount, plan and storage
// are fixed here when the order is created; nothing the browser sends can
// change them.
const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String }, // set once a payment is verified
    receipt: { type: String, required: true },
    plan: { type: String, enum: ['premium'], default: 'premium' },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, required: true },
    durationDays: { type: Number, required: true },
    storageBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'created',
    },
    verifiedVia: { type: String, enum: ['checkout', 'webhook'] },
    failureReason: { type: String, maxlength: 300 },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true, strict: 'throw' },
);

// A Razorpay payment id can only ever be attached to one order.
paymentSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string' } } },
);
paymentSchema.index({ userId: 1, createdAt: -1 });

export default model('Payment', paymentSchema);
