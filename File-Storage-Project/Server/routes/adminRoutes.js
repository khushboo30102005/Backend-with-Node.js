import express from 'express';
import checkAuth, {
  checkIsAdminUser,
  checkIsOwnerUser,
} from '../middlewares/authMiddleware.js';
import {
  resolveTargetUserFullAccess,
  resolveTargetUserReadOnly,
} from '../middlewares/resolveTargetUser.js';
import {
  createDirectory,
  deleteDirectory,
  getDirectoryById,
  renameDirectory,
} from '../controllers/directoryController.js';
import {
  deleteFile,
  getFile,
  updateFile,
  uploadFile,
} from '../controllers/fileController.js';

const router = express.Router();

// adminDirectoryRoutes.js
router.get(
  '/users/:userId/directory',
  checkAuth,
  checkIsAdminUser,
  resolveTargetUserReadOnly,
  getDirectoryById,
);
router.get(
  '/users/:userId/directory/:id',
  checkAuth,
  checkIsAdminUser,
  resolveTargetUserReadOnly,
  getDirectoryById,
);

router.post(
  '/users/:userId/directory',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  createDirectory,
);
router.post(
  '/users/:userId/directory/:parentDirId',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  createDirectory,
);

router.patch(
  '/users/:userId/directory/:id',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  renameDirectory,
);
router.delete(
  '/users/:userId/directory/:id',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  deleteDirectory,
);

// adminFileRoutes.js
router.get(
  '/users/:userId/file/:id',
  checkAuth,
  checkIsAdminUser,
  resolveTargetUserReadOnly,
  getFile,
);

router.post(
  '/users/:userId/file',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  uploadFile,
);
router.post(
  '/users/:userId/file/:parentDirId',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  uploadFile,
);

router.patch(
  '/users/:userId/file/:id',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  updateFile,
);
router.delete(
  '/users/:userId/file/:id',
  checkAuth,
  checkIsOwnerUser,
  resolveTargetUserFullAccess,
  deleteFile,
);

export default router;
