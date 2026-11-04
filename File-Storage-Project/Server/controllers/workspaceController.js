import mongoose from 'mongoose';
import Workspace from '../models/workspaceModel.js';
import WorkspaceFile from '../models/workspaceFileModel.js';
import WorkspaceVisit from '../models/workspaceVisitModel.js';
import WorkspaceActivity from '../models/workspaceActivityModel.js';
import User from '../models/userModel.js';
import { resolvePicture } from '../utils/avatar.js';
import {
  EXPIRING_SOON_MS,
  MAX_FOLDERS,
  WORKSPACE_MAX_BYTES,
  WORKSPACE_MAX_MEMBERS,
  expireIfDue,
  isPending,
  roleOf,
  stateOf,
} from '../utils/workspaceAccess.js';
import { authorize, deny, firstZodError } from '../utils/workspaceHttp.js';
import { logActivity } from '../utils/workspaceActivity.js';
import { getWorkspaceAccess } from '../utils/workspaceAccess.js';
import { purgeWorkspace } from '../services/workspaceCleanupService.js';
import {
  addMemberSchema,
  createWorkspaceSchema,
  reactivateSchema,
  transferSchema,
  updateMemberSchema,
  updateWorkspaceSchema,
} from '../validator/workspaceSchema.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const activeMembers = (ws) => ws.members.filter((m) => !isPending(m));

const summarize = (ws, userId, owner) => {
  const role = roleOf(ws, userId);
  const state = stateOf(ws);
  return {
    _id: ws._id,
    name: ws.name,
    description: ws.description,
    owner: owner ?? { _id: ws.ownerId },
    role,
    state, // active | expiring | expired | purged
    status: ws.status,
    expiresAt: ws.expiresAt,
    cleanupPolicy: ws.cleanupPolicy,
    purgeAfter: ws.purgeAfter,
    memberCount: activeMembers(ws).length + 1,
    size: ws.size,
    createdAt: ws.createdAt,
    // Whether the requester can still open it (members lose access at expiry;
    // the owner keeps read-only access to an archive).
    canOpen:
      ws.status === 'active' ||
      (ws.status === 'expired' && ws.cleanupPolicy === 'archive' && role === 'owner'),
    readOnly: ws.status !== 'active',
    canReactivate:
      role === 'owner' &&
      ws.status === 'expired' &&
      ws.cleanupPolicy === 'archive' &&
      ws.purgeAfter &&
      new Date(ws.purgeAfter) > new Date(),
  };
};

// Invitees must exist, not be deleted, not be the owner, and be unique.
async function validateMembers(members, ownerId) {
  const ids = members.map((m) => m.userId);
  if (new Set(ids).size !== ids.length) return 'Duplicate members in the list.';
  if (ids.includes(String(ownerId))) return 'The owner is already in the workspace.';
  if (ids.length) {
    const count = await User.countDocuments({ _id: { $in: ids }, isDeleted: false });
    if (count !== ids.length) return 'One or more selected users do not exist.';
  }
  return null;
}

// Total bytes of workspaces a user owns (everything not yet purged).
export async function ownerWorkspaceBytes(ownerId) {
  const [row] = await Workspace.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(String(ownerId)),
        status: { $in: ['active', 'expired'] },
      },
    },
    { $group: { _id: null, bytes: { $sum: '$size' } } },
  ]);
  return row?.bytes ?? 0;
}

// ---------------------------------------------------------------- workspaces

export const createWorkspace = async (req, res, next) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });
  const data = parsed.data;

  try {
    const memberError = await validateMembers(data.members, req.user._id);
    if (memberError) return res.status(400).json({ error: memberError });

    const owned = await Workspace.countDocuments({ ownerId: req.user._id, status: 'active' });
    if (owned >= 25) {
      return res.status(400).json({ error: 'You have reached the limit of 25 active workspaces.' });
    }

    const now = new Date();
    const ws = await Workspace.create({
      name: data.name,
      description: data.description,
      ownerId: req.user._id,
      expiresAt: data.expiresAt,
      cleanupPolicy: data.cleanupPolicy,
      // Everyone starts as a pending invitation until they accept.
      members: data.members.map((m) => ({
        ...m,
        status: 'pending',
        addedAt: now,
        addedBy: req.user._id,
      })),
    });
    await logActivity(ws._id, req.user._id, 'workspace_created', { targetName: ws.name });
    for (const m of data.members) {
      await logActivity(ws._id, req.user._id, 'member_invited', { targetUserId: m.userId, detail: m.role });
    }
    return res.status(201).json({ _id: ws._id, message: 'Workspace created' });
  } catch (err) {
    next(err);
  }
};

// GET /workspace — every workspace the user owns or belongs to.
export const listWorkspaces = async (req, res, next) => {
  try {
    const rows = await Workspace.find({
      $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }],
    })
      .sort({ expiresAt: 1 })
      .limit(200)
      .populate('ownerId', 'name email')
      .lean();

    const out = [];
    for (let ws of rows) {
      const owner = ws.ownerId;
      ws.ownerId = owner._id;
      ws = await expireIfDue(ws); // lazy expiry keeps the list honest
      // Pending invitations are shown separately (bell / invitations banner).
      if (!roleOf(ws, req.user._id)) continue;
      out.push(summarize(ws, req.user._id, { _id: owner._id, name: owner.name }));
    }
    return res.status(200).json(out);
  } catch (err) {
    next(err);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;
    const { workspace: ws, role } = access;

    // Only the owner sees who is still just invited.
    const visible = ws.members.filter((m) => role === 'owner' || !isPending(m));
    const ids = [ws.ownerId, ...visible.map((m) => m.userId)];
    const users = await User.find({ _id: { $in: ids } })
      .select('name email picture isDeleted')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const shape = async (userId, mRole, addedAt, status = 'active') => {
      const u = byId.get(String(userId));
      return {
        _id: userId,
        name: u?.name ?? 'Deleted user',
        email: u?.email ?? '',
        picture: u ? await resolvePicture(u.picture) : null,
        isDeleted: !u || !!u.isDeleted,
        role: mRole,
        status,
        addedAt,
      };
    };
    const members = await Promise.all([
      shape(ws.ownerId, 'owner', ws.createdAt),
      ...visible.map((m) => shape(m.userId, m.role, m.addedAt, isPending(m) ? 'pending' : 'active')),
    ]);

    return res.status(200).json({
      ...summarize(ws, req.user._id, {
        _id: ws.ownerId,
        name: byId.get(String(ws.ownerId))?.name,
      }),
      members,
      me: req.user._id,
      maxBytes: WORKSPACE_MAX_BYTES,
      maxMembers: WORKSPACE_MAX_MEMBERS,
      maxFolders: MAX_FOLDERS,
      serverTime: new Date(),
    });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspace = async (req, res, next) => {
  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'manage', { write: true });
    if (!access) return;

    const updated = await Workspace.findOneAndUpdate(
      { _id: access.workspace._id, status: 'active', expiresAt: { $gt: new Date() } },
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!updated) {
      return res.status(410).json({ error: 'This workspace has expired.', code: 'WORKSPACE_EXPIRED' });
    }
    const prev = access.workspace;
    if (parsed.data.expiresAt && +new Date(prev.expiresAt) !== +parsed.data.expiresAt) {
      await logActivity(prev._id, req.user._id, 'expiry_changed', {
        detail: parsed.data.expiresAt.toISOString(),
      });
    } else {
      await logActivity(prev._id, req.user._id, 'settings_updated');
    }
    return res.status(200).json({ message: 'Workspace updated' });
  } catch (err) {
    next(err);
  }
};

// POST /workspace/:id/reactivate — owner reopens an archived workspace
// before its retention window ends and the data is purged.
export const reactivateWorkspace = async (req, res, next) => {
  const parsed = reactivateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'manage');
    if (!access) return;
    const now = new Date();
    const updated = await Workspace.findOneAndUpdate(
      {
        _id: access.workspace._id,
        status: 'expired',
        cleanupPolicy: 'archive',
        purgeAfter: { $gt: now },
        $or: [{ 'cleanup.lockedUntil': null }, { 'cleanup.lockedUntil': { $lte: now } }],
      },
      {
        $set: {
          status: 'active',
          expiresAt: parsed.data.expiresAt,
          expiredAt: null,
          purgeAfter: null,
          'cleanup.attempts': 0,
          'cleanup.lastError': null,
        },
      },
    ).lean();
    if (!updated) {
      return res.status(409).json({ error: 'This workspace can no longer be reactivated.' });
    }
    await logActivity(updated._id, req.user._id, 'reactivated', {
      detail: parsed.data.expiresAt.toISOString(),
    });
    return res.status(200).json({ message: 'Workspace reactivated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /workspace/:id — owner deletes the workspace and all its data now.
export const deleteWorkspace = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'manage');
    if (!access) return;
    const { workspace: ws } = access;

    // Revoke access first so nobody can touch files mid-purge.
    await Workspace.updateOne(
      { _id: ws._id, status: 'active' },
      { $set: { status: 'expired', expiredAt: new Date(), purgeAfter: new Date() } },
    );
    const ok = await purgeWorkspace(ws._id);
    if (!ok) {
      // Access is already revoked; the sweeper will finish the cleanup.
      return res.status(202).json({ message: 'Workspace closed. Data removal will finish shortly.' });
    }
    return res.status(200).json({ message: 'Workspace deleted' });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------- members and invitations

export const addMember = async (req, res, next) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });
  const { userId, role } = parsed.data;

  try {
    const access = await authorize(req, res, 'manage', { write: true });
    if (!access) return;
    const ws = access.workspace;

    const err = await validateMembers([{ userId, role }], ws.ownerId);
    if (err) return res.status(400).json({ error: err });

    // One atomic update enforces "not already invited/a member" and the cap.
    const updated = await Workspace.findOneAndUpdate(
      {
        _id: ws._id,
        status: 'active',
        'members.userId': { $ne: userId },
        [`members.${WORKSPACE_MAX_MEMBERS - 1}`]: { $exists: false },
      },
      {
        $push: {
          members: { userId, role, status: 'pending', addedAt: new Date(), addedBy: req.user._id },
        },
      },
    ).lean();
    if (!updated) {
      return res.status(409).json({ error: 'Already invited or a member, or the member limit was reached.' });
    }
    await logActivity(ws._id, req.user._id, 'member_invited', { targetUserId: userId, detail: role });
    return res.status(201).json({ message: 'Invitation sent' });
  } catch (e) {
    next(e);
  }
};

export const updateMember = async (req, res, next) => {
  const parsed = updateMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'manage', { write: true });
    if (!access) return;
    const result = await Workspace.updateOne(
      { _id: access.workspace._id, status: 'active', 'members.userId': req.params.userId },
      { $set: { 'members.$.role': parsed.data.role } },
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Member not found.' });
    await logActivity(access.workspace._id, req.user._id, 'member_role_changed', {
      targetUserId: req.params.userId,
      detail: parsed.data.role,
    });
    return res.status(200).json({ message: 'Member updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /workspace/:id/members/:userId — the owner removes a member (or
// cancels an invitation), or a member removes themselves (leave).
export const removeMember = async (req, res, next) => {
  try {
    const access = await getWorkspaceAccess(req.params.id, req.user._id);
    if (access.error) return deny(res, access);
    const { workspace: ws, role } = access;

    const target = req.params.userId;
    const isSelf = String(req.user._id) === target;
    if (target === String(ws.ownerId)) {
      return res
        .status(400)
        .json({ error: 'The owner cannot be removed. Transfer ownership or delete the workspace.' });
    }
    if (!isSelf && role !== 'owner') {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    if (ws.status !== 'active') {
      return res.status(403).json({ error: 'This workspace is archived and read-only.' });
    }

    const result = await Workspace.updateOne({ _id: ws._id }, { $pull: { members: { userId: target } } });
    if (!result.modifiedCount) return res.status(404).json({ error: 'Member not found.' });
    await WorkspaceVisit.deleteOne({ workspaceId: ws._id, userId: target });
    await logActivity(ws._id, req.user._id, isSelf ? 'member_left' : 'member_removed', {
      targetUserId: target,
    });
    // Files they uploaded stay in the workspace (they belong to it).
    return res.status(200).json({ message: isSelf ? 'You left the workspace' : 'Member removed' });
  } catch (err) {
    next(err);
  }
};

// POST /workspace/:id/invitation/accept | decline — invitee only.
const respondToInvitation = (accept) => async (req, res, next) => {
  try {
    const now = new Date();
    const filter = {
      _id: req.params.id,
      status: 'active',
      expiresAt: { $gt: now },
      members: { $elemMatch: { userId: req.user._id, status: 'pending' } },
    };
    const update = accept
      ? { $set: { 'members.$.status': 'active', 'members.$.joinedAt': now } }
      : { $pull: { members: { userId: req.user._id, status: 'pending' } } };
    const result = await Workspace.updateOne(filter, update);
    // Uniform answer: no pending invitation / expired / unknown workspace.
    if (!result.modifiedCount) {
      return res.status(404).json({ error: 'Invitation not found or no longer valid.' });
    }
    await logActivity(req.params.id, req.user._id, accept ? 'invitation_accepted' : 'invitation_declined');
    return res.status(200).json({ message: accept ? 'You joined the workspace' : 'Invitation declined' });
  } catch (err) {
    next(err);
  }
};
export const acceptInvitation = respondToInvitation(true);
export const declineInvitation = respondToInvitation(false);

export const transferOwnership = async (req, res, next) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'manage', { write: true });
    if (!access) return;
    const ws = access.workspace;
    const target = parsed.data.userId;

    const heir = ws.members.find((m) => String(m.userId) === target && !isPending(m));
    if (!heir) {
      return res.status(400).json({ error: 'Ownership can only be transferred to a current member.' });
    }
    const user = await User.findOne({ _id: target, isDeleted: false }).select('_id').lean();
    if (!user) return res.status(400).json({ error: 'That user is not available.' });

    // The new owner leaves the member list; the old owner becomes an editor.
    // updatedAt in the filter makes this an optimistic lock: if the workspace
    // changed since we read it, nothing is written and the client retries.
    const members = [
      ...ws.members.filter((m) => String(m.userId) !== target),
      {
        userId: ws.ownerId,
        role: 'editor',
        status: 'active',
        addedAt: new Date(),
        addedBy: heir.userId,
        joinedAt: new Date(),
      },
    ];
    const updated = await Workspace.findOneAndUpdate(
      { _id: ws._id, ownerId: req.user._id, status: 'active', updatedAt: ws.updatedAt },
      { $set: { ownerId: heir.userId, members } },
    ).lean();
    if (!updated) {
      return res.status(409).json({ error: 'The workspace changed. Please try again.' });
    }
    await logActivity(ws._id, req.user._id, 'ownership_transferred', { targetUserId: target });
    return res.status(200).json({ message: 'Ownership transferred' });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------ activity

export const listActivity = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;
    const filter = { workspaceId: access.workspace._id };
    if (req.query.before) {
      const d = new Date(String(req.query.before));
      if (!Number.isNaN(d.getTime())) filter.createdAt = { $lt: d };
    }
    const rows = await WorkspaceActivity.find(filter).sort({ createdAt: -1 }).limit(31).lean();
    const hasMore = rows.length > 30;
    const page = rows.slice(0, 30);

    const userIds = [...new Set(page.flatMap((r) => [r.actorId, r.targetUserId]).filter(Boolean).map(String))];
    const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
    const names = new Map(users.map((u) => [String(u._id), u.name]));

    return res.status(200).json({
      hasMore,
      items: page.map((r) => ({
        _id: r._id,
        type: r.type,
        actor: r.actorId ? { _id: r.actorId, name: names.get(String(r.actorId)) ?? 'Deleted user' } : null,
        target: r.targetUserId
          ? { _id: r.targetUserId, name: names.get(String(r.targetUserId)) ?? 'Deleted user' }
          : null,
        targetName: r.targetName,
        detail: r.detail,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------------- search

// GET /workspace/search?q= — files (by name) across the user's open workspaces.
export const searchWorkspaceFiles = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.status(200).json([]);

    const uid = req.user._id;
    const spaces = await Workspace.find({
      status: 'active',
      expiresAt: { $gt: new Date() },
      $or: [{ ownerId: uid }, { members: { $elemMatch: { userId: uid, status: { $ne: 'pending' } } } }],
    })
      .select('name')
      .limit(100)
      .lean();
    if (spaces.length === 0) return res.status(200).json([]);

    const names = new Map(spaces.map((s) => [String(s._id), s.name]));
    const files = await WorkspaceFile.find({
      workspaceId: { $in: spaces.map((s) => s._id) },
      isReady: true,
      name: { $regex: escapeRegex(q.slice(0, 100)), $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('name size workspaceId folderId')
      .lean();

    return res.status(200).json(
      files.map((f) => ({
        _id: f._id,
        name: f.name,
        size: f.size,
        folderId: f.folderId,
        workspaceId: f.workspaceId,
        workspaceName: names.get(String(f.workspaceId)),
      })),
    );
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------- notifications
// Derived from the workspace data itself (like share notifications are
// derived from Share), so there's no second source of truth:
//   workspace-invite    pending invitation (stays until accepted/declined)
//   workspace-files     files others uploaded since the user last looked
//   workspace-expiring  expires within 24h and not yet acknowledged

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

export const getWorkspaceNotifications = async (req, res, next) => {
  try {
    const uid = toObjectId(req.user._id);
    const now = new Date();

    const spaces = await Workspace.find({
      $or: [{ ownerId: uid }, { 'members.userId': uid }],
      status: 'active',
      expiresAt: { $gt: now },
    })
      .select('name ownerId members createdAt expiresAt')
      .limit(100)
      .lean();
    if (spaces.length === 0) return res.status(200).json({ unreadCount: 0, notifications: [] });

    const me = (ws) => ws.members.find((m) => String(m.userId) === String(uid));
    const invites = spaces.filter((ws) => isPending(me(ws)));
    const joined = spaces.filter((ws) => !isPending(me(ws)));

    const visits = await WorkspaceVisit.find({
      userId: uid,
      workspaceId: { $in: joined.map((s) => s._id) },
    }).lean();
    const visitBy = new Map(visits.map((v) => [String(v.workspaceId), v]));

    // --- new files from others since the last visit
    const conds = joined.map((s) => {
      const m = me(s);
      const since = m?.joinedAt ?? m?.addedAt ?? s.createdAt;
      return {
        workspaceId: s._id,
        createdAt: { $gt: visitBy.get(String(s._id))?.lastSeenAt ?? since },
      };
    });
    const groups = conds.length
      ? await WorkspaceFile.aggregate([
          { $match: { isReady: true, uploadedBy: { $ne: uid }, $or: conds } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: '$workspaceId',
              count: { $sum: 1 },
              latestAt: { $first: '$createdAt' },
              latestName: { $first: '$name' },
              uploaderId: { $first: '$uploadedBy' },
            },
          },
          { $sort: { latestAt: -1 } },
          { $limit: 50 },
        ])
      : [];

    // --- who to show as the actor
    const userIds = [
      ...groups.map((g) => g.uploaderId),
      ...invites.map((ws) => me(ws).addedBy),
    ].filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('name picture').lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const actor = async (id) => {
      const u = id && byId.get(String(id));
      return {
        id: u?._id ?? null,
        name: u?.name ?? 'Someone',
        picture: u ? await resolvePicture(u.picture) : null,
      };
    };
    const nameOf = new Map(spaces.map((s) => [String(s._id), s.name]));

    const items = [];
    for (const ws of invites) {
      const m = me(ws);
      items.push({
        type: 'workspace-invite',
        workspaceId: ws._id,
        workspaceName: ws.name,
        role: m.role,
        expiresAt: ws.expiresAt,
        createdAt: m.addedAt,
        seen: false,
        addedBy: await actor(m.addedBy),
      });
    }
    for (const g of groups) {
      items.push({
        type: 'workspace-files',
        workspaceId: g._id,
        workspaceName: nameOf.get(String(g._id)),
        count: g.count,
        latestFileName: g.latestName,
        createdAt: g.latestAt,
        seen: false,
        uploader: await actor(g.uploaderId),
      });
    }
    for (const ws of joined) {
      const remaining = ws.expiresAt.getTime() - now.getTime();
      const acked = visitBy.get(String(ws._id))?.ackedExpiry;
      if (remaining <= EXPIRING_SOON_MS && !(acked && +acked === +ws.expiresAt)) {
        items.push({
          type: 'workspace-expiring',
          workspaceId: ws._id,
          workspaceName: ws.name,
          expiresAt: ws.expiresAt,
          createdAt: new Date(Math.min(now.getTime(), ws.expiresAt.getTime() - EXPIRING_SOON_MS)),
          seen: false,
        });
      }
    }

    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ unreadCount: items.length, notifications: items });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------------- admin

const isAdmin = (req) => req.user.role === 'Admin' || req.user.role === 'Owner';

// GET /workspace/admin/all — metadata only (no file names or contents).
export const adminListWorkspaces = async (req, res, next) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admins only.' });
  try {
    const rows = await Workspace.find({})
      .sort({ updatedAt: -1 })
      .limit(300)
      .populate('ownerId', 'name email')
      .lean();
    return res.status(200).json(
      rows.map((ws) => ({
        _id: ws._id,
        name: ws.name,
        owner: ws.ownerId ? { name: ws.ownerId.name, email: ws.ownerId.email } : null,
        status: ws.status,
        cleanupPolicy: ws.cleanupPolicy,
        memberCount: activeMembers(ws).length + 1,
        size: ws.size,
        expiresAt: ws.expiresAt,
        purgeAfter: ws.purgeAfter,
        purgedAt: ws.purgedAt,
        cleanup: {
          attempts: ws.cleanup?.attempts ?? 0,
          lastError: ws.cleanup?.lastError ?? null,
          lastAttemptAt: ws.cleanup?.lastAttemptAt ?? null,
        },
      })),
    );
  } catch (err) {
    next(err);
  }
};

// POST /workspace/admin/:id/retry-cleanup
export const adminRetryCleanup = async (req, res, next) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admins only.' });
  try {
    const ws = await Workspace.findOneAndUpdate(
      { _id: req.params.id, status: 'expired' },
      { $set: { 'cleanup.attempts': 0, 'cleanup.lockedUntil': null, 'cleanup.lastError': null } },
    ).lean();
    if (!ws) return res.status(404).json({ error: 'No expired workspace with that id.' });
    // Archives are only purged once their retention is over.
    const due = !ws.purgeAfter || new Date(ws.purgeAfter) <= new Date();
    const ok = due ? await purgeWorkspace(ws._id) : false;
    return res.status(200).json({ message: ok ? 'Cleanup completed' : 'Cleanup queued for the next sweep' });
  } catch (err) {
    next(err);
  }
};

