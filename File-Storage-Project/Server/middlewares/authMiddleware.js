import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';

export default async function checkAuth(req, res, next) {
  const { sid } = req.signedCookies;
  if (!sid) {
    res.clearCookie('sid');
    return res.status(401).json({ error: 'Not logged in!' });
  }
  const session = await Session.findById(sid).lean();
  if (!session) {
    return res.status(401).json({ error: 'Not logged in!' });
  }
  const user = await User.findOne({ _id: session.userId }).lean();
  if (!user) {
    return res.status(401).json({ error: 'Not logged in!' });
  }
  req.user = user;
  next();
}
