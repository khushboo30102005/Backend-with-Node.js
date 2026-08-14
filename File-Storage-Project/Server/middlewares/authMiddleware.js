import redisClient from '../config/redis.js';
import User from '../models/userModel.js';

export default async function checkAuth(req, res, next) {
  const { sid } = req.signedCookies;
  if (!sid) {
    res.clearCookie('sid');
    return res.status(401).json({ error: 'Not logged in!' });
  }
  const session = await redisClient.json.get(`session:${sid}`);
  if (!session) {
    return res.status(401).json({ error: 'Not logged in!' });
  }
  req.user = {
    _id: session.userId,
    rootDirId: session.rootDirId,
    role: session.role,
  };
  next();
}

export const checkNotRegularUser = (req, res, next) => {
  if (req.user.role !== 'User') return next();
  res.status(403).json({ error: 'You can not access users' });
};

export const checkIsAdminUser = (req, res, next) => {
  if (req.user.role === 'Admin' || req.user.role === 'Owner') return next();
  res.status(403).json({ error: 'You can not delete users' });
};

export const checkIsOwnerUser = (req, res, next) => {
  if (req.user.role === 'Owner') return next();
  res.status(403).json({ error: 'Only an Owner can recover deleted users' });
};
