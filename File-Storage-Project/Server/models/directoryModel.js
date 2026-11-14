import { model, Schema } from 'mongoose';

const directorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Directory name is required'],
      trim: true,
      minLength: [3, 'Directory name must be at least 3 characters long'],
      maxLength: [100, 'Directory name cannot exceed 100 characters'],
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    parentDirId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Directory',
    },
    path: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    // Only used on a user's root directory: uploads that have reserved quota
    // but not finished yet. Their bytes are already included in `size`, so the
    // quota check and the reservation are one atomic update on one document.
    // Hidden from normal reads (API responses never include it).
    pendingUploads: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            bytes: { type: Number, required: true },
            fileId: { type: Schema.Types.ObjectId, default: null },
            objectKey: { type: String, default: null },
            uploadId: { type: String, default: null },
            at: { type: Date, required: true }, // refreshed while streaming
          },
          { _id: false, strict: 'throw' },
        ),
      ],
      default: undefined,
      select: false,
    },
  },
  { strict: 'throw', timestamps: true },
);

// Stale-reservation sweeper lookups.
directorySchema.index({ 'pendingUploads.at': 1 }, { sparse: true });

const Directory = model('Directory', directorySchema);

export default Directory;