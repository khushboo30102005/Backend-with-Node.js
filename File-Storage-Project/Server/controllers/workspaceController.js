import path from 'path';
import mongoose from 'mongoose';
import { once } from 'events';
import { PassThrough } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3, { BUCKET_NAME } from '../config/b2.js';
import Workspace from '../models/workspaceModel.js';
import WorkspaceFile from '../models/workspaceFileModel.js';
import User from '../models/userModel.js';
import { resolvePicture } from '../utils/avatar.js';
import {
  WORKSPACE_MAX_BYTES,
  WORKSPACE_MAX_MEMBERS,
  canPerformWs,
  expireIfDue,
  getWorkspaceAccess,
  roleOf,
  stateOf,
} from '../utils/workspaceAccess.js';
import { purgeWorkspace, workspaceObjectKey } from '../services/workspaceCleanupService.js';
import {
  addMemberSchema,
  createWorkspaceSchema,
  renameWorkspaceFileSchema,
  transferSchema,
  updateMemberSchema,
  updateWorkspaceSchema,
} from '../validator/workspaceSchema.js';

const firstZodError = (result) => result.error.issues[0]?.message || 'Invalid input';

// Sends the right error for a denied access result and returns true.
const deny = (res, access) => {
  const { status, code, message, workspace } = access.error;
  res.status(status).json({
    error: message,
    ...(code && { code }),
    ...(workspace && {
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        expiresAt: workspace.expiresAt,
        cleanupPolicy: workspace.cleanupPolicy,
        status: workspace.status,
      },
    }),
  });
};

// Loads access and enforces an action in one place. Returns the access object
// or null after having already responded.
async function authorize(req, res, action, { write = false } = {}) {
  const access = await getWorkspaceAccess(req.params.id, req.user._id);
  if (access.error) {
    deny(res, access);
    return null;
  }
  if (!canPerformWs(access.role, action)) {
    res.status(403).json({ error: 'You do not have permission to do this.' });
    return null;
  }
  if (write && access.readOnly) {
    res.status(403).json({ error: 'This workspace is archived and read-only.' });
    return null;
  }
  return access;
}

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
    memberCount: ws.members.length + 1,
    size: ws.size,
    createdAt: ws.createdAt,
    // Whether the requester can still open it (members lose access at expiry;
    // the owner keeps read-only access to an archive).
    canOpen:
      ws.status === 'active' ||
      (ws.status === 'expired' && ws.cleanupPolicy === 'archive' && role === 'owner'),
    readOnly: ws.status !== 'active',
  };
};

// Validates member ids: must exist, not deleted, not the owner, unique.
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

// ---------------------------------------------------------------- workspaces

export const createWorkspace = async (req, res, next) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });
  const data = parsed.data;

  try {
    const memberError = await validateMembers(data.members, req.user._id);
    if (memberError) return res.status(400).json({ error: memberError });

    const owned = await Workspace.countDocuments({
      ownerId: req.user._id,
      status: 'active',
    });
    if (owned >= 25) {
      return res
        .status(400)
        .json({ error: 'You have reached the limit of 25 active workspaces.' });
    }

    const ws = await Workspace.create({
      name: data.name,
      description: data.description,
      ownerId: req.user._id,
      expiresAt: data.expiresAt,
      cleanupPolicy: data.cleanupPolicy,
      members: data.members.map((m) => ({ ...m, addedBy: req.user._id })),
    });
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
      // A purged workspace has no members left, so only its owner still sees it.
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
    const { workspace: ws } = access;

    const ids = [ws.ownerId, ...ws.members.map((m) => m.userId)];
    const users = await User.find({ _id: { $in: ids } })
      .select('name email picture isDeleted')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    const shape = async (userId, role, addedAt) => {
      const u = byId.get(String(userId));
      return {
        _id: userId,
        name: u?.name ?? 'Deleted user',
        email: u?.email ?? '',
        picture: u ? await resolvePicture(u.picture) : null,
        isDeleted: !u || !!u.isDeleted,
        role,
        addedAt,
      };
    };
    const members = await Promise.all([
      shape(ws.ownerId, 'owner', ws.createdAt),
      ...ws.members.map((m) => shape(m.userId, m.role, m.addedAt)),
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
    return res.status(200).json({ message: 'Workspace updated' });
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
      return res
        .status(202)
        .json({ message: 'Workspace closed. Data removal will finish shortly.' });
    }
    return res.status(200).json({ message: 'Workspace deleted' });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------- members

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

    // One atomic update enforces "not already a member" and the member cap.
    const updated = await Workspace.findOneAndUpdate(
      {
        _id: ws._id,
        status: 'active',
        'members.userId': { $ne: userId },
        [`members.${WORKSPACE_MAX_MEMBERS - 1}`]: { $exists: false },
      },
      { $push: { members: { userId, role, addedAt: new Date(), addedBy: req.user._id } } },
    ).lean();
    if (!updated) {
      return res
        .status(409)
        .json({ error: 'Already a member, or the member limit was reached.' });
    }
    return res.status(201).json({ message: 'Member added' });
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
    return res.status(200).json({ message: 'Member updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /workspace/:id/members/:userId — the owner removes a member, or a
// member removes themselves (leave).
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

    const result = await Workspace.updateOne(
      { _id: ws._id },
      { $pull: { members: { userId: target } } },
    );
    if (!result.modifiedCount) return res.status(404).json({ error: 'Member not found.' });
    // Files they uploaded stay in the workspace (they belong to it).
    return res.status(200).json({ message: isSelf ? 'You left the workspace' : 'Member removed' });
  } catch (err) {
    next(err);
  }
};

export const transferOwnership = async (req, res, next) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'manage', { write: true });
    if (!access) return;
    const target = new mongoose.Types.ObjectId(parsed.data.userId);

    const user = await User.findOne({ _id: target, isDeleted: false }).select('_id').lean();
    if (!user) return res.status(400).json({ error: 'That user is not available.' });

    // New owner leaves the member list; the old owner becomes an editor.
    const updated = await Workspace.findOneAndUpdate(
      {
        _id: access.workspace._id,
        ownerId: req.user._id,
        status: 'active',
        'members.userId': target,
      },
      [
        {
          $set: {
            members: {
              $concatArrays: [
                { $filter: { input: '$members', cond: { $ne: ['$$this.userId', target] } } },
                [{ userId: '$ownerId', role: 'editor', addedAt: '$$NOW', addedBy: target, seenAt: '$$NOW' }],
              ],
            },
            ownerId: target,
          },
        },
      ],
    ).lean();
    if (!updated) {
      return res.status(400).json({ error: 'Ownership can only be transferred to a current member.' });
    }
    return res.status(200).json({ message: 'Ownership transferred' });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------------------------- files

export const listWorkspaceFiles = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;

    const files = await WorkspaceFile.find({
      workspaceId: access.workspace._id,
      isReady: true,
    })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name')
      .lean();

    const me = String(req.user._id);
    const { role, readOnly } = access;
    return res.status(200).json(
      files.map((f) => {
        const mine = String(f.uploadedBy?._id) === me;
        return {
          _id: f._id,
          name: f.name,
          size: f.size,
          extension: f.extension,
          uploadedBy: f.uploadedBy ? { _id: f.uploadedBy._id, name: f.uploadedBy.name } : null,
          createdAt: f.createdAt,
          canRename: !readOnly && canPerformWs(role, 'rename'),
          canDelete:
            !readOnly &&
            (canPerformWs(role, 'deleteAny') || (mine && canPerformWs(role, 'deleteOwn'))),
        };
      }),
    );
  } catch (err) {
    next(err);
  }
};

const releaseQuota = (workspaceId, bytes) =>
  Workspace.updateOne({ _id: workspaceId }, { $inc: { size: -bytes } }).catch(() => {});

export const uploadWorkspaceFile = async (req, res, next) => {
  let fileDoc;
  let key;
  let reserved = 0;
  let wsId;

  try {
    const access = await authorize(req, res, 'upload', { write: true });
    if (!access) return;
    wsId = access.workspace._id;

    const filename = String(req.headers.filename || 'untitled').slice(0, 255);
    const filesize = Number(req.headers.filesize);
    if (!Number.isFinite(filesize) || filesize < 0) {
      return res.status(400).json({ error: 'Invalid filesize' });
    }

    // Reserve quota atomically, and only while the workspace is still active,
    // so parallel uploads can't overshoot the limit.
    const ok = await Workspace.findOneAndUpdate(
      {
        _id: wsId,
        status: 'active',
        expiresAt: { $gt: new Date() },
        size: { $lte: WORKSPACE_MAX_BYTES - filesize },
      },
      { $inc: { size: filesize } },
    ).lean();
    if (!ok) {
      return res
        .status(413)
        .json({ error: 'Not enough workspace storage space, or the workspace has expired.' });
    }
    reserved = filesize;

    const extension = path.extname(filename);
    fileDoc = await WorkspaceFile.create({
      workspaceId: wsId,
      name: filename,
      size: filesize,
      extension,
      uploadedBy: req.user._id,
    });
    key = workspaceObjectKey(wsId, fileDoc);

    let total = 0;
    const body = new PassThrough();
    const writer = (async () => {
      for await (const chunk of req) {
        total += chunk.length;
        if (total > filesize) {
          const err = new Error('FILESIZE_EXCEEDED');
          body.destroy(err);
          throw err;
        }
        if (!body.write(chunk)) await once(body, 'drain');
      }
      body.end();
    })();

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: req.headers['content-type'] || 'application/octet-stream',
      },
    });
    await Promise.all([writer, upload.done()]);

    if (total !== filesize) throw new Error('FILESIZE_MISMATCH');

    // The workspace may have expired (or been purged) mid-upload: only publish
    // the file if it's still active, otherwise roll everything back.
    const stillActive = await Workspace.exists({
      _id: wsId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
    const published =
      stillActive &&
      (await WorkspaceFile.updateOne({ _id: fileDoc._id }, { $set: { isReady: true } }))
        .matchedCount;
    if (!published) throw new Error('WORKSPACE_EXPIRED');

    return res.status(201).json({ message: 'File Uploaded' });
  } catch (err) {
    if (fileDoc) await WorkspaceFile.deleteOne({ _id: fileDoc._id }).catch(() => {});
    if (key) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
        .catch(() => {});
    }
    if (reserved) await releaseQuota(wsId, reserved);
    if (res.headersSent) return;
    if (err.message === 'FILESIZE_EXCEEDED' || err.message === 'FILESIZE_MISMATCH') {
      return res.status(400).json({ error: 'Uploaded file size does not match the declared size.' });
    }
    if (err.message === 'WORKSPACE_EXPIRED') {
      return res
        .status(410)
        .json({ error: 'This workspace expired during the upload.', code: 'WORKSPACE_EXPIRED' });
    }
    next(err);
  }
};

const findFile = (workspaceId, fileId) =>
  WorkspaceFile.findOne({ _id: fileId, workspaceId, isReady: true });

export const getWorkspaceFile = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;

    const file = await findFile(access.workspace._id, req.params.fileId).lean();
    if (!file) return res.status(404).json({ error: 'File not found!' });

    const key = workspaceObjectKey(access.workspace._id, file);
    const isDownload = req.query.action === 'download';

    if (req.query.format === 'text') {
      if (file.size > 2 * 1024 * 1024) {
        return res.status(413).json({ error: 'File is too large to preview.' });
      }
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
      return res.type('text/plain; charset=utf-8').send(await obj.Body.transformToString());
    }

    // Short-lived URL; a member removed or an expiry after this point only
    // keeps working for these few seconds.
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.name)}"`,
      }),
      { expiresIn: 60 },
    );
    if (req.query.format === 'json') return res.json({ url });
    return res.redirect(url);
  } catch (err) {
    next(err);
  }
};

export const renameWorkspaceFile = async (req, res, next) => {
  const parsed = renameWorkspaceFileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'rename', { write: true });
    if (!access) return;
    const result = await WorkspaceFile.updateOne(
      { _id: req.params.fileId, workspaceId: access.workspace._id, isReady: true },
      { $set: { name: parsed.data.newFilename } },
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'File not found!' });
    return res.status(200).json({ message: 'Renamed' });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkspaceFile = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'deleteOwn', { write: true });
    if (!access) return;

    const file = await findFile(access.workspace._id, req.params.fileId).lean();
    if (!file) return res.status(404).json({ error: 'File not found!' });

    const mine = String(file.uploadedBy) === String(req.user._id);
    if (!mine && !canPerformWs(access.role, 'deleteAny')) {
      return res.status(403).json({ error: 'You can only delete files you uploaded.' });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: workspaceObjectKey(access.workspace._id, file),
      }),
    );
    const del = await WorkspaceFile.deleteOne({ _id: file._id });
    if (del.deletedCount) await releaseQuota(access.workspace._id, file.size);
    return res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
};


// ------------------------------------------------------------- notifications
// Derived from the membership rows themselves (like share notifications are
// derived from Share): being added = a member entry with seenAt === null.

const RECENT_READ_LIMIT = 10;
const UNREAD_LIMIT = 50;

// GET /workspace/notifications
export const getWorkspaceNotifications = async (req, res, next) => {
  try {
    const me = String(req.user._id);
    const rows = await Workspace.find({
      'members.userId': req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    })
      .select('name members expiresAt')
      .limit(200)
      .lean();

    const items = rows
      .map((ws) => ({ ws, m: ws.members.find((x) => String(x.userId) === me) }))
      .filter((x) => x.m)
      .sort((a, b) => new Date(b.m.addedAt) - new Date(a.m.addedAt));

    const unread = items.filter((x) => !x.m.seenAt).slice(0, UNREAD_LIMIT);
    const read = items.filter((x) => x.m.seenAt).slice(0, RECENT_READ_LIMIT);
    const picked = [...unread, ...read];

    const adderIds = [...new Set(picked.map((x) => x.m.addedBy).filter(Boolean).map(String))];
    const adders = await User.find({ _id: { $in: adderIds } }).select('name picture').lean();
    const byId = new Map(adders.map((u) => [String(u._id), u]));

    const notifications = await Promise.all(
      picked.map(async ({ ws, m }) => {
        const a = m.addedBy && byId.get(String(m.addedBy));
        return {
          type: 'workspace',
          workspaceId: ws._id,
          workspaceName: ws.name,
          role: m.role,
          expiresAt: ws.expiresAt,
          createdAt: m.addedAt,
          seen: Boolean(m.seenAt),
          addedBy: {
            id: a?._id ?? null,
            name: a?.name ?? 'Someone',
            picture: a ? await resolvePicture(a.picture) : null,
          },
        };
      }),
    );
    return res.status(200).json({ unreadCount: unread.length, notifications });
  } catch (err) {
    next(err);
  }
};

// POST /workspace/notifications/seen   body: { workspaceIds: [...] }
// Only ever touches the requester's own membership entries.
export const markWorkspaceNotificationsSeen = async (req, res, next) => {
  const raw = req.body?.workspaceIds;
  const ids = Array.isArray(raw) ? raw.filter((id) => mongoose.isValidObjectId(id)) : [];
  if (ids.length === 0) return res.status(204).end();

  try {
    await Workspace.updateMany(
      { _id: { $in: ids }, 'members.userId': req.user._id },
      { $set: { 'members.$[m].seenAt': new Date() } },
      { arrayFilters: [{ 'm.userId': req.user._id, 'm.seenAt': null }] },
    );
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};
