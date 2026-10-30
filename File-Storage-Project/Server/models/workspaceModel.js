import { model, Schema } from 'mongoose';

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    role: { type: String, enum: ['editor', 'viewer'], required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false, strict: 'throw' },
);

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 100,
    },
    description: { type: String, trim: true, maxLength: 500, default: '' },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    members: { type: [memberSchema], default: [] },
    expiresAt: { type: Date, required: true },
    // archive: owner keeps read-only access for a retention window, then purge.
    // delete:  data is purged right after expiry.
    cleanupPolicy: { type: String, enum: ['archive', 'delete'], default: 'delete' },
    // Stored lifecycle. "Expiring soon" is derived from expiresAt, not stored.
    status: { type: String, enum: ['active', 'expired', 'purged'], default: 'active' },
    expiredAt: { type: Date, default: null },
    purgeAfter: { type: Date, default: null },
    purgedAt: { type: Date, default: null },
    // Bytes used by workspace files (quota is per workspace, separate from
    // personal storage).
    size: { type: Number, default: 0 },
    cleanup: {
      attempts: { type: Number, default: 0 },
      lastError: { type: String, default: null },
      lastAttemptAt: { type: Date, default: null },
      lockedUntil: { type: Date, default: null },
    },
  },
  { strict: 'throw', timestamps: true },
);

workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ 'members.userId': 1 });
// Sweeper lookups
workspaceSchema.index({ status: 1, expiresAt: 1 });
workspaceSchema.index({ status: 1, purgeAfter: 1 });

const Workspace = model('Workspace', workspaceSchema);

export default Workspace;
