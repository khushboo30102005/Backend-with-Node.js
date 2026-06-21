import User from '../models/userMonde.js';

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies;
  console.log(uid);
  const { id, expiry } = JSON.parse(Buffer.from(uid, 'base64url').toString());
  if (!uid) {
    return res.status(401).json({ error: 'Not logged!' });
  }
  const expiryTimeInSeconds = expiry;
  const currentTimeInSeconds = Math.round(Date.now() / 1000);
  console.log({ expiryTimeInSeconds, currentTimeInSeconds });
  console.log(currentTimeInSeconds - expiryTimeInSeconds);
  if (currentTimeInSeconds > expiryTimeInSeconds) {
    res.clearCookie('uid');
    return res.status(401).json({ error: 'Not logged!' });
  }
  const user = await User.findOne({ _id: id }).lean();
  if (!user) {
    return res.status(401).json({ error: 'Not logged!' });
  }
  req.user = user;
  next();
}
