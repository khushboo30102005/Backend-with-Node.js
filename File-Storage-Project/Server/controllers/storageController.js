import mongoose from 'mongoose';
import File from '../models/fileModel.js';
import Directory from '../models/directoryModel.js';
import User from '../models/userModel.js';

// GET /storage/summary — always scoped to the signed-in user (req.user).
export const getStorageSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [user, rootDir, totals, largeFiles] = await Promise.all([
      User.findById(userId).select('maxStorageInBytes isDeleted').lean(),
      Directory.findById(req.user.rootDirId).select('size').lean(),
      File.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $ifNull: ['$isTrashed', false] },
            count: { $sum: 1 },
            size: { $sum: '$size' },
          },
        },
      ]),
      File.find({ userId, isTrashed: { $ne: true } })
        .sort({ size: -1 })
        .limit(8)
        .select('name size')
        .lean(),
    ]);

    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'User not found or account is unavailable.' });
    }

    const live = totals.find((t) => t._id === false);
    const trashed = totals.find((t) => t._id === true);

    return res.status(200).json({
      used: rootDir ? rootDir.size : 0,
      max: user.maxStorageInBytes,
      fileCount: live?.count || 0,
      trashedCount: trashed?.count || 0,
      trashedBytes: trashed?.size || 0,
      largeFiles,
    });
  } catch (err) {
    next(err);
  }
};