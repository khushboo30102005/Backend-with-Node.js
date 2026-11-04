import { model, Schema } from 'mongoose';

const workspaceFolderSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    parentId: { type: Schema.Types.ObjectId, ref: 'WorkspaceFolder', default: null },
    name: { type: String, required: true, trim: true, minLength: 1, maxLength: 100 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { strict: 'throw', timestamps: true },
);

// Folder names are unique within one parent folder.
workspaceFolderSchema.index({ workspaceId: 1, parentId: 1, name: 1 }, { unique: true });

export default model('WorkspaceFolder', workspaceFolderSchema);
