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
import storageRoutes from './routes/storageRoutes.js';
import checkAuth from './middlewares/authMiddleware.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import trashRoutes from './routes/trashRoutes.js';
await connectDB();
const app = express();
const port = process.env.PORT || 4000;

// Keep-alive target for an uptime pinger (Render's free tier sleeps after ~15
// idle minutes). Registered before CORS, rate limiting and auth, and touches
// no database, so frequent pings are cheap and never hit a limiter.
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ status: 'ok' });
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET)); // this middleware parses the cookie send by the client, because it has secretKey, it can also verify signedCookie.
app.use(express.json());
// Requests pass through two proxies in production (Vercel rewrite, then Render),
// so trust 2 hops. With 1, every user would share Vercel's IP in the rate limiters.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);

app.use(helmet());

app.use(apiLimiter);

app.use('/directory', checkAuth, directoryRoutes);
app.use('/file', checkAuth, fileRoutes);
app.use('/', userRoutes);
app.use('/auth', authRoutes);
app.use('/share', checkAuth, shareRoutes);
app.use('/trash', checkAuth, trashRoutes);
app.use('/storage', checkAuth, storageRoutes);


app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({ error: 'Something went wrong!!' });
});

app.listen(port, () => {
  console.log(`Server Started`);
});