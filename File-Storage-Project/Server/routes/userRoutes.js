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

const router = express.Router();

router.post('/user/register', register);

router.post('/user/login', login);

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

export default router;
