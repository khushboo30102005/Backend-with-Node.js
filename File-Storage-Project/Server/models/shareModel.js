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
    // Notification state. null = the recipient hasn't opened "Shared with me"
    // since this share was created (unread). Set once, when they do.
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { strict: 'throw', timestamps: true },
);

// A file can only be shared with a given user once — enforced at the DB
// level so a race condition (two rapid POST /share calls) can't create
// duplicate grants. This is also what makes duplicate notifications for the
// same share event impossible: one share row = one notification.
shareSchema.index(
  { resourceId: 1, sharedWithUserId: 1 },
  { unique: true },
);

// Fast "my unread / my recent shares" lookups for the bell
shareSchema.index({ sharedWithUserId: 1, seenAt: 1, createdAt: -1 });

const Share = model('Share', shareSchema);

export default Share;