import mongoose from 'mongoose';
import Share from '../models/shareModel.js';
import File from '../models/fileModel.js';
import User from '../models/userModel.js';

const VALID_PERMISSIONS = ['viewer', 'editor'];

export const createShare = async (req, res, next) => {
  const { fileId, targetUserId, permission } = req.body;

  if (
    !mongoose.isValidObjectId(fileId) ||
    !mongoose.isValidObjectId(targetUserId)
  ) {
    return res.status(400).json({ error: 'Invalid file or user id.' });
  }

  if (!VALID_PERMISSIONS.includes(permission)) {
    return res.status(400).json({ error: 'Invalid permission.' });
  }

  if (targetUserId === req.user._id.toString()) {
    return res
      .status(400)
      .json({ error: 'You cannot share a file with yourself.' });
  }

  try {
    const file = await File.findById(fileId).select('userId').lean();
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Ownership is checked against the file itself, never trusted from the
    // request body — the only ownerId that will ever be written is the
    // authenticated requester's own id.
    if (file.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: 'You do not own this file.' });
    }

    const targetUser = await User.findOne({
      _id: targetUserId,
      isDeleted: false,
    })
      .select('_id')
      .lean();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const existing = await Share.findOne({
      resourceId: fileId,
      sharedWithUserId: targetUserId,
    }).select('_id');
    if (existing) {
      return res.status(409).json({
        error: 'Already shared with this user. Use the update option to change their permission.',
      });
    }

    const share = await Share.create({
      resourceId: fileId,
      resourceType: 'file',
      ownerId: req.user._id,
      sharedWithUserId: targetUserId,
      permission,
    });

    return res.status(201).json({ message: 'File shared.', share });
  } catch (err) {
    next(err);
  }
};

// "People with access" list — owner only.
export const getSharesForFile = async (req, res, next) => {
  const { resourceId } = req.params;

  try {
    const file = await File.findById(resourceId).select('userId').lean();
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    if (file.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not own this file.' });
    }

    const shares = await Share.find({ resourceId })
      .populate('sharedWithUserId', 'name email picture')
      .lean();

    return res.status(200).json(
      shares.map((s) => ({
        shareId: s._id,
        permission: s.permission,
        user: s.sharedWithUserId,
      })),
    );
  } catch (err) {
    next(err);
  }
};

export const updateShare = async (req, res, next) => {
  const { shareId } = req.params;
  const { permission } = req.body;

  if (!VALID_PERMISSIONS.includes(permission)) {
    return res.status(400).json({ error: 'Invalid permission.' });
  }

  try {
    const share = await Share.findById(shareId);
    if (!share) {
      return res.status(404).json({ error: 'Share not found.' });
    }

    // Only the file's owner can change a share's permission — this also
    // blocks a shared user from escalating their own access by hitting
    // this route with their own shareId.
    if (share.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not own this share.' });
    }

    share.permission = permission;
    await share.save();

    return res.status(200).json({ message: 'Permission updated.' });
  } catch (err) {
    next(err);
  }
};

export const deleteShare = async (req, res, next) => {
  const { shareId } = req.params;

  try {
    const share = await Share.findById(shareId);
    if (!share) {
      return res.status(404).json({ error: 'Share not found.' });
    }

    if (share.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not own this share.' });
    }

    await share.deleteOne();

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const getSharedWithMe = async (req, res, next) => {
  try {
    const shares = await Share.find({ sharedWithUserId: req.user._id })
      .populate('resourceId', 'name extension size updatedAt')
      .populate('ownerId', 'name email')
      .lean();

    const result = shares
      // Defensive: if a File was ever deleted without its Share records
      // being cleaned up, don't surface or crash on the dangling entry.
      .filter((s) => s.resourceId)
      .map((s) => ({
        shareId: s._id,
        permission: s.permission,
        sharedBy: s.ownerId,
        file: {
          id: s.resourceId._id,
          name: s.resourceId.name,
          extension: s.resourceId.extension,
          size: s.resourceId.size,
          updatedAt: s.resourceId.updatedAt,
        },
      }));

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const searchUsers = async (req, res, next) => {
  const q = (req.query.q || '').trim();

  if (q.length < 3) {
    return res.status(200).json([]);
  }

  try {
    const users = await User.find({
      email: { $regex: '^' + escapeRegex(q), $options: 'i' },
      isDeleted: false,
      _id: { $ne: req.user._id },
    })
      .select('_id name email picture')
      .limit(8)
      .lean();

    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};