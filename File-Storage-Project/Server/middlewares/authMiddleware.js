import User from '../models/userMonde.js';

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies;
  if (!uid) {
    return res.status(401).json({ error: 'Not logged!' });
  }
  const user = await User.findOne({ _id: uid }).lean();
  if (!user) {
    return res.status(401).json({ error: 'Not logged!' });
  }
  req.user = user;
  next();
}
