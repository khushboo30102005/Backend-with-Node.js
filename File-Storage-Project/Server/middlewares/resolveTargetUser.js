// middlewares/resolveTargetUser.js
import User from '../models/userModel.js';

const ROLE_RANKS = { User: 0, Manager: 1, Admin: 2, Owner: 3 };

export const resolveOwnUser = (req, res, next) => {
  req.targetUser = req.user;
  next();
};

export const resolveTargetUserReadOnly = async (req, res, next) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  req.targetUser = targetUser;
  req.readOnly = true; // controllers check this to block writes
  next();
};

export const resolveTargetUserFullAccess = async (req, res, next) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  req.targetUser = targetUser;
  req.readOnly = false;
  next();
};