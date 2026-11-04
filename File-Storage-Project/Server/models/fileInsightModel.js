import { model, Schema } from 'mongoose';

// One AI result per file. Kept in its own collection so the strict File
// schema (and its DB validator) stay untouched.
const fileInsightSchema = new Schema(
  {
    fileId: { type: Schema.Types.ObjectId, required: true, ref: 'File' },
    // The file's owner. Every query filters on this (or on a Share).
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'failed', 'unsupported'],
      required: true,
    },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    summary: { type: String, default: '' },
    category: { type: String, default: null },
    tags: { type: [String], default: [] },
    // Never returned by default; only the search endpoint asks for it.
    embedding: { type: [Number], default: [], select: false },
    provider: { type: String, default: null },
    model: { type: String, default: null },
    embedModel: { type: String, default: null },
    truncated: { type: Boolean, default: false },
    charCount: { type: Number, default: 0 },
    analyzedAt: { type: Date, default: null },
  },
  { strict: 'throw', timestamps: true },
);

fileInsightSchema.index({ fileId: 1 }, { unique: true });
fileInsightSchema.index({ userId: 1, status: 1 });

const FileInsight = model('FileInsight', fileInsightSchema);

export default FileInsight;
