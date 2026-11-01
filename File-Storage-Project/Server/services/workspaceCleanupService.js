import { DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME } from '../config/b2.js';
import Workspace from '../models/workspaceModel.js';
import WorkspaceFile from '../models/workspaceFileModel.js';
import WorkspaceVisit from '../models/workspaceVisitModel.js';
import WorkspaceFolder from '../models/workspaceFolderModel.js';
import WorkspaceActivity from '../models/workspaceActivityModel.js';
import User from '../models/userModel.js';
import { logActivity } from '../utils/workspaceActivity.js';
import { STALE_UPLOAD_MS, expireIfDue, isPending } from '../utils/workspaceAccess.js';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;
const SWEEP_INTERVAL_MS = (Number(process.env.WORKSPACE_SWEEP_SECONDS) || 60) * 1000;

export const workspaceObjectKey = (workspaceId, file) =>
  `workspaces/${workspaceId}/${file._id}${file.extension || ''}`;

/**
 * Permanently removes a workspace's files from B2 and the database.
 * Idempotent and safe to retry: B2 deletes of missing keys succeed, file
 * documents are removed only after their objects are gone, and the workspace
 * is marked `purged` only once nothing is left. A lock lease prevents two
 * instances (or a request and the sweeper) from purging the same workspace.
 */
export async function purgeWorkspace(workspaceId) {
  const now = new Date();
  const ws = await Workspace.findOneAndUpdate(
    {
      _id: workspaceId,
      status: { $in: ['active', 'expired'] },
      $or: [
        { 'cleanup.lockedUntil': null },
        { 'cleanup.lockedUntil': { $lte: now } },
      ],
    },
    {
      $set: {
        'cleanup.lockedUntil': new Date(now.getTime() + LOCK_MS),
        'cleanup.lastAttemptAt': now,
      },
    },
    { new: true },
  ).lean();
  if (!ws) return false; // already purged or being handled elsewhere

  try {
    while (true) {
      const files = await WorkspaceFile.find({ workspaceId })
        .select('_id extension')
        .limit(1000)
        .lean();
      if (files.length === 0) break;

      const res = await s3.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: files.map((f) => ({ Key: workspaceObjectKey(workspaceId, f) })),
            Quiet: true,
          },
        }),
      );
      if (res.Errors?.length) {
        throw new Error(
          `B2 failed to delete ${res.Errors.length} object(s): ${res.Errors[0].Message}`,
        );
      }
      await WorkspaceFile.deleteMany({ _id: { $in: files.map((f) => f._id) } });
    }

    await WorkspaceVisit.deleteMany({ workspaceId });
    await WorkspaceFolder.deleteMany({ workspaceId });
    await WorkspaceActivity.deleteMany({ workspaceId });
    await Workspace.updateOne(
      { _id: workspaceId },
      {
        $set: {
          status: 'purged',
          purgedAt: new Date(),
          size: 0,
          members: [],
          'cleanup.lockedUntil': null,
          'cleanup.lastError': null,
        },
      },
    );
    return true;
  } catch (err) {
    console.error(`[workspace-cleanup] purge failed for ${workspaceId}:`, err.message);
    await Workspace.updateOne(
      { _id: workspaceId },
      {
        $set: {
          'cleanup.lastError': String(err.message).slice(0, 300),
          // back off: retry on the next sweep after the lease runs out
        },
        $inc: { 'cleanup.attempts': 1 },
      },
    ).catch(() => {});
    return false;
  }
}

// Uploads that never finished (server crash / restart mid-stream) hold a
// reserved quota and possibly a partial B2 object. Free both.
export async function cleanupStaleUploads() {
  const cutoff = new Date(Date.now() - STALE_UPLOAD_MS);
  const stale = await WorkspaceFile.find({ isReady: false, createdAt: { $lt: cutoff } })
    .limit(100)
    .lean();
  for (const f of stale) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: workspaceObjectKey(f.workspaceId, f),
        }),
      );
      const del = await WorkspaceFile.deleteOne({ _id: f._id, isReady: false });
      if (del.deletedCount) {
        await Workspace.updateOne(
          { _id: f.workspaceId, size: { $gte: f.size } },
          { $inc: { size: -f.size } },
        );
      }
    } catch (err) {
      console.error(`[workspace-cleanup] stale upload ${f._id}:`, err.message);
    }
  }
}

// A workspace whose owner account was deleted must not be left unmanaged:
// hand it to the longest-standing editor (else any active member). With
// nobody to hand it to, close and purge it.
export async function adoptOrphanedWorkspaces() {
  const active = await Workspace.find({ status: 'active' })
    .select('ownerId members updatedAt name')
    .lean();
  if (active.length === 0) return;
  const ownerIds = [...new Set(active.map((w) => String(w.ownerId)))];
  const gone = await User.find({ _id: { $in: ownerIds }, isDeleted: true })
    .select('_id')
    .lean();
  const goneSet = new Set(gone.map((u) => String(u._id)));
  if (goneSet.size === 0) return;

  for (const ws of active.filter((w) => goneSet.has(String(w.ownerId)))) {
    const eligible = ws.members
      .filter((m) => !isPending(m) && !goneSet.has(String(m.userId)))
      .sort(
        (a, b) =>
          (a.role === 'editor' ? 0 : 1) - (b.role === 'editor' ? 0 : 1) ||
          new Date(a.joinedAt ?? a.addedAt) - new Date(b.joinedAt ?? b.addedAt),
      );
    const heir = eligible[0];
    if (heir) {
      const updated = await Workspace.findOneAndUpdate(
        { _id: ws._id, ownerId: ws.ownerId, updatedAt: ws.updatedAt },
        {
          $set: {
            ownerId: heir.userId,
            members: ws.members.filter((m) => String(m.userId) !== String(heir.userId)),
          },
        },
      ).lean();
      if (updated) {
        await logActivity(ws._id, null, 'owner_auto_transferred', {
          targetUserId: heir.userId,
          detail: 'Previous owner account was deleted',
        });
      }
    } else {
      await Workspace.updateOne(
        { _id: ws._id, status: 'active' },
        { $set: { status: 'expired', expiredAt: new Date(), purgeAfter: new Date() } },
      );
      await purgeWorkspace(ws._id);
    }
  }
}

export async function runSweep() {
  const now = new Date();

  await cleanupStaleUploads().catch((e) => console.error('[workspace-cleanup]', e.message));
  await adoptOrphanedWorkspaces().catch((e) => console.error('[workspace-cleanup]', e.message));

  // 1. Active workspaces whose time is up -> expired (access revoked).
  const due = await Workspace.find({ status: 'active', expiresAt: { $lte: now } })
    .limit(100)
    .lean();
  for (const ws of due) await expireIfDue(ws);

  // 2. Expired workspaces whose retention is over -> purge data.
  //    Capped retries so a permanently failing workspace doesn't loop forever;
  //    it stays `expired` with `cleanup.lastError` set for an admin to inspect.
  const toPurge = await Workspace.find({
    status: 'expired',
    purgeAfter: { $lte: now },
    'cleanup.attempts': { $lt: MAX_ATTEMPTS },
  })
    .select('_id')
    .limit(20)
    .lean();
  for (const ws of toPurge) await purgeWorkspace(ws._id);
}

export function startWorkspaceSweeper() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runSweep();
    } catch (err) {
      console.error('[workspace-cleanup] sweep failed:', err.message);
    } finally {
      running = false;
    }
  };
  tick(); // catch up immediately after a restart / wake from sleep
  const timer = setInterval(tick, SWEEP_INTERVAL_MS);
  timer.unref();
}
