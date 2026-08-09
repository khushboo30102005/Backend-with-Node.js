import express from 'express';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import {
  deleteFile,
  getFile,
  updateFile,
  uploadFile,
} from '../controllers/fileController.js';

import { resolveOwnUser } from '../middlewares/resolveTargetUser.js';

const router = express.Router();

router.param('parentDirId',resolveOwnUser, validateIdMiddleware);

router.param('id',resolveOwnUser, validateIdMiddleware);

router.post('/{:parentDirId}',resolveOwnUser, uploadFile);

router.get('/:id',resolveOwnUser, getFile);

router.patch('/:id', resolveOwnUser, updateFile);

router.delete('/:id',resolveOwnUser, deleteFile);

export default router;
