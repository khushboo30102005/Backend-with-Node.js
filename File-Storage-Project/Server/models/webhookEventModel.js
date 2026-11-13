import { model, Schema } from 'mongoose';

// Remembers which webhook deliveries were already handled, so Razorpay's
// retries are acknowledged without being processed twice.
const webhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  { strict: 'throw' },
);

export default model('WebhookEvent', webhookEventSchema);
