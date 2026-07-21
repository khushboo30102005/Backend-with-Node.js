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
      required: true,
    },
  },
  { strict: 'throw' },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  console.log(this.password)
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
const User = model('User', userSchema);

export default User;
