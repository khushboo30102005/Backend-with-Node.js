import express from 'express';
import { getTrash } from '../controllers/trashController.js';

const router = express.Router();

router.get('/', getTrash);

export default router;