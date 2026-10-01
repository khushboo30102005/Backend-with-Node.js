import { model, Schema } from 'mongoose';

const shareSchema = new Schema(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'File',
    },
    resourceType: {
      type: String,
      enum: ['file'],
      default: 'file',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sharedWithUserId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    permission: {
      type: String,
      enum: ['viewer', 'editor'],
      required: true,
    },
  },
  { strict: 'throw', timestamps: true },
);

// A file can only be shared with a given user once — enforced at the DB
// level so a race condition (two rapid POST /share calls) can't create
// duplicate grants.
shareSchema.index(
  { resourceId: 1, sharedWithUserId: 1 },
  { unique: true },
);

const Share = model('Share', shareSchema);

export default Share;