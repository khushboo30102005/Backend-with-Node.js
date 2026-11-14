import express from 'express';
import { perUserLimiter } from '../middlewares/rateLimitMiddleware.js';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import {
  acceptInvitation,
  addMember,
  adminListWorkspaces,
  adminRetryCleanup,
  createWorkspace,
  declineInvitation,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceNotifications,
  listActivity,
  listWorkspaces,
  reactivateWorkspace,
  removeMember,
  searchWorkspaceFiles,
  transferOwnership,
  updateMember,
  updateWorkspace,
} from '../controllers/workspaceController.js';
import {
  createFolder,
  deleteFolder,
  deleteWorkspaceFile,
  getWorkspaceFile,
  importFromDrive,
  listFolders,
  listWorkspaceFiles,
  moveWorkspaceFile,
  renameFolder,
  renameWorkspaceFile,
  saveToDrive,
  uploadWorkspaceFile,
} from '../controllers/workspaceFileController.js';

const router = express.Router();

// Counted per signed-in user in Redis (audit M5); mounted behind checkAuth.
const limiter = (name, limit, windowMs, message) =>
  perUserLimiter({ name, limit, windowMs, message });

const HOUR = 60 * 60 * 1000;
const createLimiter = limiter('ws-create', 20, HOUR, 'Too many workspaces created. Please try again later.');
// Invitations raise notifications for other people, so cap them tightly.
const inviteLimiter = limiter('ws-invite', 60, HOUR, 'Too many invitations sent. Please try again later.');
const uploadLimiter = limiter('ws-upload', 120, HOUR, 'Too many uploads. Please try again later.');

router.param('id', validateIdMiddleware);
router.param('userId', validateIdMiddleware);
router.param('fileId', validateIdMiddleware);
router.param('folderId', validateIdMiddleware);

// Fixed paths must stay above '/:id' so they aren't parsed as an id.
router.get('/notifications', getWorkspaceNotifications);
router.get('/search', searchWorkspaceFiles);
router.get('/admin/all', adminListWorkspaces);
router.post('/admin/:id/retry-cleanup', adminRetryCleanup);

router.get('/', listWorkspaces);
router.post('/', createLimiter, createWorkspace);

router.get('/:id', getWorkspace);
router.patch('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:id/reactivate', reactivateWorkspace);
router.get('/:id/activity', listActivity);

router.post('/:id/members', inviteLimiter, addMember);
router.patch('/:id/members/:userId', updateMember);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/transfer', transferOwnership);
router.post('/:id/invitation/accept', acceptInvitation);
router.post('/:id/invitation/decline', declineInvitation);

router.get('/:id/folders', listFolders);
router.post('/:id/folders', createFolder);
router.patch('/:id/folders/:folderId', renameFolder);
router.delete('/:id/folders/:folderId', deleteFolder);

router.get('/:id/files', listWorkspaceFiles);
router.post('/:id/files', uploadLimiter, uploadWorkspaceFile);
router.post('/:id/files/import', uploadLimiter, importFromDrive);
router.get('/:id/files/:fileId', getWorkspaceFile);
router.patch('/:id/files/:fileId', renameWorkspaceFile);
router.patch('/:id/files/:fileId/move', moveWorkspaceFile);
router.post('/:id/files/:fileId/save-to-drive', saveToDrive);
router.delete('/:id/files/:fileId', deleteWorkspaceFile);

export default router;
