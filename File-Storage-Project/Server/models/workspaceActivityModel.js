import { model, Schema } from 'mongoose';

// Append-only audit trail shown in the workspace's Activity tab.
const workspaceActivitySchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    actorId: { type: Schema.Types.ObjectId, default: null, ref: 'User' }, // null = system
    type: { type: String, required: true, maxLength: 40 },
    targetName: { type: String, default: '', maxLength: 255 },
    targetUserId: { type: Schema.Types.ObjectId, default: null, ref: 'User' },
    detail: { type: String, default: '', maxLength: 255 },
  },
  { strict: 'throw', timestamps: { createdAt: true, updatedAt: false } },
);

workspaceActivitySchema.index({ workspaceId: 1, createdAt: -1 });

export default model('WorkspaceActivity', workspaceActivitySchema);
