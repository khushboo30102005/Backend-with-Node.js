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
  },
  { strict: 'throw', timestamps: true },
);

const Directory = model('Directory', directorySchema);

export default Directory;