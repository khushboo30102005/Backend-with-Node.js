import mongoose from 'mongoose';
import Share from '../models/shareModel.js';

// Notifications are derived from the Share collection itself — no second
// source of truth to drift out of sync. A share the user has not yet seen
// (seenAt === null) is an unread notification.

const RECENT_READ_LIMIT = 10;
const UNREAD_LIMIT = 50;

function load(filter, limit) {
  return Share.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('resourceId', 'name isTrashed')
    .populate('ownerId', 'name picture')
    .lean();
}

// GET /share/notifications
export const getNotifications = async (req, res, next) => {
  const me = req.user._id.toString();

  try {
    const [unread, read] = await Promise.all([
      load({ sharedWithUserId: me, seenAt: null }, UNREAD_LIMIT),
      load({ sharedWithUserId: me, seenAt: { $ne: null } }, RECENT_READ_LIMIT),
    ]);

    // Drop dangling/trashed files and (defensively) anything the user owns.
    const valid = (s) =>
      s.resourceId &&
      !s.resourceId.isTrashed &&
      s.ownerId &&
      s.ownerId._id.toString() !== me;

    const toDto = (s) => ({
      shareId: s._id,
      resourceType: s.resourceType,
      permission: s.permission,
      createdAt: s.createdAt,
      seen: Boolean(s.seenAt),
      sharedBy: {
        id: s.ownerId._id,
        name: s.ownerId.name,
        picture: s.ownerId.picture,
      },
      file: { id: s.resourceId._id, name: s.resourceId.name },
    });

    const unreadDtos = unread.filter(valid).map(toDto);
    const readDtos = read.filter(valid).map(toDto);

    return res.status(200).json({
      unreadCount: unreadDtos.length,
      notifications: [...unreadDtos, ...readDtos],
    });
  } catch (err) {
    next(err);
  }
};

// POST /share/notifications/seen   body: { shareIds: [...] }
// Marks exactly the shares the client just displayed as seen, and only if they
// belong to the requester — one user can never touch another's state.
export const markNotificationsSeen = async (req, res, next) => {
  const raw = req.body?.shareIds;
  const ids = Array.isArray(raw)
    ? raw.filter((id) => mongoose.isValidObjectId(id))
    : [];

  if (ids.length === 0) return res.status(204).end();

  try {
    await Share.updateMany(
      {
        _id: { $in: ids },
        sharedWithUserId: req.user._id,
        seenAt: null,
      },
      { $set: { seenAt: new Date() } },
    );
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};