
import User from '../models/userModel.js';

const ROLE_RANKS = { User: 0, Manager: 1, Admin: 2, Owner: 3 };

export const resolveOwnUser = (req, res, next) => {
  req.targetUser = req.user;
  next();
};

