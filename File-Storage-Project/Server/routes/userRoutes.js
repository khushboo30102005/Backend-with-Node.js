import express from 'express';
import checkAuth, {
  checkIsAdminUser,
  checkIsOwnerUser,
  checkNotRegularUser,
} from '../middlewares/authMiddleware.js';
import {
  getCurrentUser,
  getAllUsers,
  login,
  logout,
  logoutAll,
  register,
  logoutById,
  deleteUser,
  permanentlyDeleteUser,
  getDeletedUsers,
  recoverUser,
  changeUserRole,
} from '../controllers/userController.js';
import { authLimiter } from '../middlewares/rateLimitMiddleware.js';
import { searchUsers } from '../controllers/shareController.js';

const router = express.Router();

router.post('/user/register',authLimiter, register);

router.post('/user/login',authLimiter, login);

router.get('/user', checkAuth, getCurrentUser);

router.post('/user/logout', logout);

router.post('/user/logout-all', logoutAll);

router.get('/users', checkAuth, checkNotRegularUser, getAllUsers);

router.post(
  '/users/:userId/logout',
  checkAuth,
  checkNotRegularUser,
  logoutById,
);

router.get('/users/deleted', checkAuth, checkIsOwnerUser, getDeletedUsers);

router.delete('/users/:userId', checkAuth, checkIsAdminUser, deleteUser);

router.delete(
  '/users/:userId/hard',
  checkAuth,
  checkIsAdminUser,
  permanentlyDeleteUser,
);

router.patch('/users/:userId/recover', checkAuth, checkIsOwnerUser, recoverUser);

router.patch('/users/:userId/role', checkAuth, checkNotRegularUser, changeUserRole);


router.get('/users/search', checkAuth, searchUsers);

export default router;
