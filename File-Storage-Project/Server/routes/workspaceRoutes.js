import express from 'express';
import rateLimit from 'express-rate-limit';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import {
  addMember,
  createWorkspace,
  deleteWorkspace,
  deleteWorkspaceFile,
  getWorkspace,
  getWorkspaceFile,
  listWorkspaceFiles,
  listWorkspaces,
  removeMember,
  renameWorkspaceFile,
  transferOwnership,
  updateMember,
  updateWorkspace,
  uploadWorkspaceFile,
} from '../controllers/workspaceController.js';

const router = express.Router();

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many workspaces created. Please try again later.' },
});

router.param('id', validateIdMiddleware);
router.param('userId', validateIdMiddleware);
router.param('fileId', validateIdMiddleware);

router.get('/', listWorkspaces);
router.post('/', createLimiter, createWorkspace);

router.get('/:id', getWorkspace);
router.patch('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

router.post('/:id/members', addMember);
router.patch('/:id/members/:userId', updateMember);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/transfer', transferOwnership);

router.get('/:id/files', listWorkspaceFiles);
router.post('/:id/files', uploadWorkspaceFile);
router.get('/:id/files/:fileId', getWorkspaceFile);
router.patch('/:id/files/:fileId', renameWorkspaceFile);
router.delete('/:id/files/:fileId', deleteWorkspaceFile);

export default router;
