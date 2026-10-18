import express from 'express';
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_INPUT_BYTES,
} from '../utils/avatar.js';
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
  setPassword,
  updateProfile,
  updatePicture,
  removePicture,
  changePassword,
} from '../controllers/userController.js';
import { authLimiter, avatarLimiter } from '../middlewares/rateLimitMiddleware.js';
import { searchUsers } from '../controllers/shareController.js';

const router = express.Router();

router.post('/user/register',authLimiter, register);

router.post('/user/login',authLimiter, login);

router.get('/user', checkAuth, getCurrentUser);

router.patch('/user', checkAuth, updateProfile);

// Raw image body (no multipart). Size is enforced here before anything is
// read; the real format is verified again by the image processor.
const readAvatarBody = (req, res, next) =>
  express.raw({ type: AVATAR_ALLOWED_TYPES, limit: AVATAR_MAX_INPUT_BYTES })(
    req,
    res,
    (err) => {
      if (!err) return next();
      if (err.type === 'entity.too.large') {
        return res
          .status(413)
          .json({ error: 'Image is too large. Maximum size is 5 MB.' });
      }
      return res.status(400).json({ error: 'Could not read the upload.' });
    },
  );

router.patch(
  '/user/picture',
  checkAuth,
  avatarLimiter,
  readAvatarBody,
  updatePicture,
);

router.delete('/user/picture', checkAuth, avatarLimiter, removePicture);

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

router.post('/user/set-password', checkAuth, authLimiter, setPassword);

router.post('/user/change-password', checkAuth, authLimiter, changePassword);

export default router;