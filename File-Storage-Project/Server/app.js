import { connectDB } from './config/db.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import directoryRoutes from './routes/directoryRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cookieProbeRoutes from './routes/cookieProbeRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import checkAuth from './middlewares/authMiddleware.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import { trustProxyHops } from './config/proxy.js';
import { csrfProtection, issueCsrfToken } from './middlewares/csrfMiddleware.js';
import trashRoutes from './routes/trashRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { handleWebhook } from './controllers/paymentController.js';
import { startSubscriptionSweeper } from './services/subscriptionService.js';
import { startWorkspaceSweeper } from './services/workspaceCleanupService.js';
import { startStorageReservationSweeper } from './services/storageQuotaService.js';
await connectDB();
const app = express();
const port = process.env.PORT || 4000;

// Keep-alive target for an uptime pinger (Render's free tier sleeps after ~15
// idle minutes). Registered before CORS, rate limiting and auth, and touches
// no database, so frequent pings are cheap and never hit a limiter.
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ status: 'ok' });
});

// Razorpay webhook. Must come BEFORE express.json(): the signature is computed
// over the exact raw bytes, so the body has to stay an unparsed Buffer here.
// It is server-to-server (no cookies/CORS) and authenticated by its signature.
app.post(
  '/payments/webhook',
  express.raw({ type: () => true, limit: '256kb' }),
  handleWebhook,
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET)); // this middleware parses the cookie send by the client, because it has secretKey, it can also verify signedCookie.
app.use(express.json());
// Requests pass through several proxies in production (Vercel rewrite, then
// Render's edge). The hop count decides which X-Forwarded-For entry becomes
// req.ip for the per-IP rate limiters; see config/proxy.js before changing it.
app.set('trust proxy', trustProxyHops());

app.use(helmet());

// Stateless cookie probe for the sign-in pages: before the global limiter so
// it can neither be blocked by, nor use up, the shared API budget.
app.use('/auth/cookie-test', cookieProbeRoutes);

app.use(apiLimiter);

// CSRF (M4): the React app fetches a token here and sends it back in the
// X-CSRF-Token header on every state-changing request. The Razorpay webhook
// above is registered earlier and is therefore not affected.
app.get('/auth/csrf-token', issueCsrfToken);
app.use(csrfProtection);

app.use('/directory', checkAuth, directoryRoutes);
app.use('/file', checkAuth, fileRoutes);
app.use('/', userRoutes);
app.use('/auth', authRoutes);
app.use('/share', checkAuth, shareRoutes);
app.use('/trash', checkAuth, trashRoutes);
app.use('/storage', checkAuth, storageRoutes);
app.use('/ai', checkAuth, aiRoutes);
app.use('/workspace', checkAuth, workspaceRoutes);
app.use('/payments', checkAuth, paymentRoutes);


app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({ error: 'Something went wrong!!' });
});

app.listen(port, () => {
  console.log(`Server Started`);
  startWorkspaceSweeper();
  startSubscriptionSweeper();
  startStorageReservationSweeper();
});