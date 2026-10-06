import mongoose, { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

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
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/,
        'Email must be a valid email address',
      ],
    },

    password: {
      type: String,
      minlength: [4, 'Password must be at least 4 characters long'],
    },

    picture: {
      type: String,
      default:
        'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'User', 'Owner'],
      default: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    rootDirId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    maxStorageInBytes: {
      type:Number,
      required: true,
      default: 1 * 1024 ** 3,
    },
  },
  { strict: 'throw' },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};
const User = model('User', userSchema);

export default User;
