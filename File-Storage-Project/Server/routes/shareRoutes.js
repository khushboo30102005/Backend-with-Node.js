import express from 'express';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import {getNotifications, markNotificationsSeen} from '../controllers/notificationController.js'
import {
  createShare,
  getSharesForFile,
  updateShare,
  deleteShare,
  getSharedWithMe,
} from '../controllers/shareController.js';

const router = express.Router();

router.param('resourceId', validateIdMiddleware);
router.param('shareId', validateIdMiddleware);

router.post('/', createShare);
router.get('/with-me', getSharedWithMe);

// Must stay above '/:resourceId' so "notifications" isn't parsed as an id
router.get('/notifications', getNotifications);
router.post('/notifications/seen', markNotificationsSeen);

router.get('/:resourceId', getSharesForFile);
router.patch('/:shareId', updateShare);
router.delete('/:shareId', deleteShare);

export default router;
