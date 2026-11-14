import { model, Schema } from 'mongoose';

// Append-only, application-wide security audit trail (account-level events
// such as the initial Owner setup). Workspace events have their own
// collection (workspaceActivityModel.js).
const auditLogSchema = new Schema(
  {
    type: { type: String, required: true, maxLength: 60 },
    outcome: { type: String, required: true, enum: ['success', 'denied'] },
    actorId: { type: Schema.Types.ObjectId, default: null, ref: 'User' }, // null = system / CLI operator
    targetUserId: { type: Schema.Types.ObjectId, default: null, ref: 'User' },
    targetEmail: { type: String, default: '', maxLength: 320 },
    detail: { type: String, default: '', maxLength: 255 },
    source: { type: String, default: '', maxLength: 40 }, // e.g. 'cli'
    host: { type: String, default: '', maxLength: 255 },
    osUser: { type: String, default: '', maxLength: 255 },
  },
  { strict: 'throw', timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ type: 1, createdAt: -1 });

export default model('AuditLog', auditLogSchema);
