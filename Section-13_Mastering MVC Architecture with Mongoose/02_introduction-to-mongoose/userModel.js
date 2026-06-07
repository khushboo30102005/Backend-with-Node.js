import { model, Schema } from 'mongoose';
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required, please enter the name'],
      minlength: [3, 'Name must be at least 3 characters long'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required, please enter the age'],
      min: 12,
      // Custom Validator: Validating Even Numbers
      validate: {
        validator() {
          console.log('Running Custom Validator');
          console.log(this);
          return this.age % 2 === 0;
        },
        message: 'age must be a even number',
      },
    },
    email: {
      type: String,
      required: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email',
      ],
      trim: true,
      lowercase: true,
    },
    hobbies: {
      type: [String],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.age < 16;
      },
      default: null,
      ref: 'User'
    },
  },
  { strict: 'throw', timestamps: true },
);
const User = model('User', userSchema);

export default User;
