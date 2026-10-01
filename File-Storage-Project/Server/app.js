import { connectDB } from './config/db.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import directoryRoutes from './routes/directoryRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import checkAuth from './middlewares/authMiddleware.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import trashRoutes from './routes/trashRoutes.js';
await connectDB();
const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET)); // this middleware parses the cookie send by the client, because it has secretKey, it can also verify signedCookie.
app.use(express.json());


app.use(helmet());

app.use(apiLimiter);

app.use('/directory', checkAuth, directoryRoutes);
app.use('/file', checkAuth, fileRoutes);
app.use('/', userRoutes);
app.use('/auth', authRoutes);
app.use('/share', checkAuth, shareRoutes);
app.use('/trash', checkAuth, trashRoutes);


app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({ error: 'Something went wrong!!' });
});

app.listen(port, () => {
  console.log(`Server Started`);
});
