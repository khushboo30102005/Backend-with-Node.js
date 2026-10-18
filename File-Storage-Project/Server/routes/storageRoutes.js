import express from 'express';
import { getStorageSummary } from '../controllers/storageController.js';

const router = express.Router();

router.get('/summary', getStorageSummary);

export default router;