import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(
      'mongodb://khushboo:khushboo123@127.0.0.1:27017/storageApp',
    );
    console.log('Database Connected!!!');
  } catch (error) {
    console.log(error)
    console.log(error.message);
    process.exit(1);
  }
}
// signal interrupt handler to close the database connection gracefully
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  console.log('Database disconnected');
  process.exit(0);
});
