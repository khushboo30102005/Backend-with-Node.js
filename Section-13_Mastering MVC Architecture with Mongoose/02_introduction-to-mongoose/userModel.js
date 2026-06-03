import mongoose, { Schema } from 'mongoose';
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
      required: function(){
        return this.age < 16;
      },
      default: null,
    }
  },
  { strict: 'throw',
    timestamps: true,
    // versionKey: '__version',
    // collection: 'test'
    
   },
);
const User = mongoose.model('User', userSchema);

const data = await User.insertOne({
  name: 'Alice',
  age: 14,
  email: 'alice@example.com',
  parentId: '6a1ff2d764fd94973ca0b733'
  
});
console.log(data);
