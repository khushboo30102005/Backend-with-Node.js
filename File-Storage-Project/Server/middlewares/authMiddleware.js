import User from '../models/userMonde.js';

export default async function checkAuth(req, res, next) {
  console.log(req.signedCookies)
  console.log(req.cookies)
  const { token } = req.signedCookies;
  if (!token) {
     res.clearCookie('token')
    return res.status(401).json({ error: 'Not logged in!' });
  }
  const { id, expiry: expiryTimeInSeconds } = JSON.parse((Buffer.from(token, 'base64url').toString()));
  const currentTimeInSeconds = Math.round(Date.now() / 1000);  
  if (currentTimeInSeconds > expiryTimeInSeconds) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Not logged in!' });
  }

  const user = await User.findOne({ _id: id }).lean();
  if (!user) {
    return res.status(401).json({ error: 'Not logged in!' });
  }
  req.user = user;
  next();
}
