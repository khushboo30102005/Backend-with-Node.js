import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    courses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
);

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
