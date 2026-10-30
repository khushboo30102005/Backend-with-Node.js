import { model, Schema } from 'mongoose';

const workspaceFileSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    name: { type: String, required: true, trim: true, maxLength: 255 },
    size: { type: Number, required: true },
    extension: { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    // false while the upload is streaming to B2; the file is hidden until done.
    isReady: { type: Boolean, default: false },
  },
  { strict: 'throw', timestamps: true },
);

workspaceFileSchema.index({ workspaceId: 1, createdAt: -1 });

const WorkspaceFile = model('WorkspaceFile', workspaceFileSchema);

export default WorkspaceFile;
