import express from 'express';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import {
  deleteFile,
  getFile,
  moveFile,
  permanentlyDeleteFile,
  restoreFile,
  updateFile,
  uploadFile,
} from '../controllers/fileController.js';

import { resolveOwnUser } from '../middlewares/resolveTargetUser.js';

const router = express.Router();

router.param('parentDirId', validateIdMiddleware);

router.param('id', validateIdMiddleware);

router.use(resolveOwnUser);

router.post('/{:parentDirId}', uploadFile);

router.get('/:id', getFile);

router.patch('/:id', updateFile);

router.delete('/:id', deleteFile);

router.patch('/:id/move', moveFile);


// fileRoutes.js — same idea
router.patch('/:id/restore', restoreFile);
router.delete('/:id/permanent', permanentlyDeleteFile);
export default router;
