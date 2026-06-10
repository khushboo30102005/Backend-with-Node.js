import { model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [3, 'Username must be at least 3 characters long'],
    },
    email: {
      type: String,
      required: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[A-Za-z]{2,}$/,
        'Email must be a valid email address',
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: [3, 'Password must be at least 3 characters long'],
    },
    rootDirId: {
      type: Schema.Types.ObjectId,
      required: true
    },
  },
  { versionKey: false, strict: 'throw' },
);

const User = model('User', userSchema);

export default User;
