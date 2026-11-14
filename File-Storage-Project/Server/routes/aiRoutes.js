import express from 'express';
import { perUserLimiter } from '../middlewares/rateLimitMiddleware.js';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import {
  getAiStatus,
  getInsight,
  analyzeFile,
  clearInsight,
  getInsightsBatch,
  searchFiles,
} from '../controllers/aiController.js';
import { scheduleRecovery } from '../ai/insightService.js';

// Mounted in app.js behind checkAuth:  app.use('/ai', checkAuth, aiRoutes);
const router = express.Router();

const aiLimiter = perUserLimiter({
  name: 'ai',
  limit: 60,
  message: 'Too many AI requests. Please try again later.',
});

router.param('id', validateIdMiddleware);

router.get('/status', getAiStatus);
router.post('/insights/batch', getInsightsBatch);
router.post('/search', aiLimiter, searchFiles);
router.get('/files/:id', getInsight);
router.post('/files/:id/analyze', aiLimiter, analyzeFile);
router.delete('/files/:id', clearInsight);

scheduleRecovery();

export default router;
