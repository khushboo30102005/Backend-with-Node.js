import { connectDB } from './config/db.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import directoryRoutes from './routes/directoryRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import checkAuth from './middlewares/authMiddleware.js';

await connectDB();
const app = express();
const port = process.env.port || 4000;
app.use(cookieParser(process.env.SESSION_SECRET)); // this middleware parses the cookie send by the client, because it has secretKey, it can also verify signedCookie.
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use('/directory', checkAuth, directoryRoutes);
app.use('/file', checkAuth, fileRoutes);
app.use('/', userRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({ error: 'Something went wrong!!' });
});

app.listen(port, () => {
  console.log(`Server Started`);
});
