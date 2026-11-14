import { model, Schema } from 'mongoose';

// One-off, application-wide flags keyed by a fixed string _id.
//
// The `owner-bootstrap` document is the permanent "initial Owner setup has
// happened" switch. Because _id is unique, inserting it is an atomic claim:
// of two concurrent setup attempts only one can succeed, even on a
// standalone MongoDB without transactions. It is never deleted by the app.
const systemStateSchema = new Schema(
  {
    _id: { type: String, required: true },
    completedAt: { type: Date, required: true },
    ownerId: { type: Schema.Types.ObjectId, default: null, ref: 'User' },
  },
  { strict: 'throw', versionKey: false },
);

export default model('SystemState', systemStateSchema);
