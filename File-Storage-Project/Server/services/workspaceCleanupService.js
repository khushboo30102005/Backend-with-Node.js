import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME } from '../config/b2.js';
import Workspace from '../models/workspaceModel.js';
import WorkspaceFile from '../models/workspaceFileModel.js';
import { expireIfDue } from '../utils/workspaceAccess.js';

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

export async function runSweep() {
  const now = new Date();

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
