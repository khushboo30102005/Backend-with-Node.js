import express from 'express';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import { ObjectId } from 'mongodb';
import {
  createDirectory,
  deleteDirectory,
  getDirectoryById,
  renameDirectory,
} from '../controllers/directoryController.js';
import { resolveOwnUser } from '../middlewares/resolveTargetUser.js';

const router = express.Router();

router.param('parentDirId', validateIdMiddleware);

router.param('id', validateIdMiddleware);

router.route('/{:parentDirId}').post(resolveOwnUser, createDirectory);
router.route('/{:id}').get(resolveOwnUser, getDirectoryById);
router
  .route('/:id')
  .patch(resolveOwnUser, renameDirectory)
  .delete(resolveOwnUser, deleteDirectory);

export default router;
