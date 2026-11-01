import { model, Schema } from 'mongoose';

// When a user last looked at a workspace's file list. Anything uploaded by
// someone else after this moment is "new" for that user (drives the bell).
const workspaceVisitSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    lastSeenAt: { type: Date, required: true },
    // The expiresAt the user already acknowledged (expiry-warning dismissal).
    // Extending the workspace changes expiresAt, so the warning can return.
    ackedExpiry: { type: Date, default: null },
  },
  { strict: 'throw' },
);

workspaceVisitSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default model('WorkspaceVisit', workspaceVisitSchema);
