import { ObjectId } from 'mongodb';

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies;
  if (!uid) {
    return res.status(401).json({ error: 'Not logged!' });
  }
  const db = req.db;
  const user = await db.collection('users').findOne({ _id: new ObjectId(uid) });
  if (!user) {
    return res.status(401).json({ error: 'Not logged!' });
  }
  req.user = user;
  next();
}
