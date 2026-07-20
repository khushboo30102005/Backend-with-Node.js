import mongoose from 'mongoose';

const fruitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30,
  },
});

const Fruit = mongoose.model('Fruit', fruitSchema);

await mongoose.connect(process.env.MONGODB_URI);

await Fruit.create({
  name: 'Apple',
});

await mongoose.disconnect();

