// Permanent ("hard") deletion of a user account and everything that belongs
// to it (audit finding H4).
//
// Guarantees:
//   - Only an account that is already soft-deleted can be purged.
//   - Every query is scoped to the target user's id; B2 keys are derived from
//     that user's own file documents or from the `avatars/<userId>/` prefix,
//     so another user's data can never be selected.
//   - Idempotent and retry-safe: each step deletes B2 objects BEFORE the
//     database rows that point to them, and the user document is removed
//     LAST. If any step fails the user stays soft-deleted, a persistent
//     "purge started" marker blocks recovery of the half-deleted account, and
//     simply calling purgeUser again finishes the job.
//   - A short Redis lock stops two concurrent purges of the same user.
//   - Payment records are financial records and are intentionally kept (they
//     hold the Razorpay ids and amounts, and no email/name). The Subscription
//     (entitlement state, not a ledger) is removed.
import crypto from 'node:crypto';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME } from '../config/b2.js';
import redisClient from '../config/redis.js';
import User from '../models/userModel.js';
import File from '../models/fileModel.js';
import Directory from '../models/directoryModel.js';
import Share from '../models/shareModel.js';
import Subscription from '../models/subscriptionModel.js';
import { deleteInsightsForFiles, deleteInsightsForUser } from '../ai/insightService.js';
import { deleteAllSessionsForUser } from './delRedisSessionsService.js';
import { releaseWorkspacesOfUser } from './workspaceCleanupService.js';
import { AVATAR_PREFIX } from '../utils/avatar.js';

const LOCK_TTL_SECONDS = 15 * 60;
const BATCH = 1000; // B2/S3 DeleteObjects limit

export const purgeLockKey = (userId) => `user-purge:lock:${userId}`;
export const purgeMarkerKey = (userId) => `user-purge:started:${userId}`;

export class PurgeError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** True while a purge of this user has started and not yet completed. */
export async function isPurgeInProgress(userId) {
  return Boolean(await redisClient.get(purgeMarkerKey(userId)));
}

async function deleteKeys(keys) {
  for (let i = 0; i < keys.length; i += BATCH) {
    const batch = keys.slice(i, i + BATCH);
    if (batch.length === 0) continue;
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    if (res?.Errors?.length) {
      throw new Error(
        `B2 failed to delete ${res.Errors.length} object(s): ${res.Errors[0].Message}`,
      );
    }
  }
}

// Personal files: objects first, then the documents, shares and AI insights
// that reference them. Loops until no file document of the user remains.
async function purgeFiles(userId) {
  while (true) {
    const files = await File.find({ userId })
      .select('_id extension')
      .limit(BATCH)
      .lean();
    if (files.length === 0) return;
    await deleteKeys(files.map((f) => `${String(f._id)}${f.extension || ''}`));
    const ids = files.map((f) => f._id);
    await Share.deleteMany({ resourceId: { $in: ids } });
    await deleteInsightsForFiles(ids);
    await File.deleteMany({ _id: { $in: ids }, userId });
  }
}

// Objects of uploads that were still in flight (reserved on the root
// directory) when the account was deleted.
async function purgePendingUploadObjects(userId) {
  const roots = await Directory.find({ userId, parentDirId: null })
    .select('+pendingUploads')
    .lean();
  const keys = roots
    .flatMap((r) => r.pendingUploads || [])
    .map((p) => p.objectKey)
    .filter((k) => typeof k === 'string' && k.length > 0);
  await deleteKeys(keys);
}

// Every avatar object ever uploaded by this user (current one plus any
// leftovers from failed replacements). Restricted to the user's own prefix.
async function purgeAvatars(userId, picture) {
  const prefix = `${AVATAR_PREFIX}${userId}/`;
  let token;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    const keys = (page?.Contents || [])
      .map((o) => o.Key)
      .filter((k) => typeof k === 'string' && k.startsWith(prefix));
    await deleteKeys(keys);
    token = page?.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  if (typeof picture === 'string' && picture.startsWith(prefix)) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: picture }));
  }
}

async function acquireLock(userId) {
  const token = crypto.randomUUID();
  const ok = await redisClient.set(purgeLockKey(userId), token, {
    condition: 'NX',
    expiration: { type: 'EX', value: LOCK_TTL_SECONDS },
  });
  return ok ? token : null;
}

async function releaseLock(userId, token) {
  try {
    if ((await redisClient.get(purgeLockKey(userId))) === token) {
      await redisClient.del(purgeLockKey(userId));
    }
  } catch (err) {
    console.error(`[user-purge] could not release lock for ${userId}:`, err.message);
  }
}

/**
 * Permanently deletes a soft-deleted user and all associated data.
 * Throws PurgeError for precondition failures (not found / not soft-deleted /
 * already running). Any other error means the purge is incomplete and should
 * be retried; the account stays soft-deleted and blocked from recovery.
 */
export async function purgeUser(userId) {
  const user = await User.findById(userId).select('_id isDeleted picture').lean();
  if (!user) throw new PurgeError('NOT_FOUND', 'User not found', 404);
  if (!user.isDeleted) {
    throw new PurgeError(
      'NOT_SOFT_DELETED',
      'Soft-delete the user before deleting them permanently.',
      409,
    );
  }

  const lock = await acquireLock(userId);
  if (!lock) {
    throw new PurgeError(
      'PURGE_IN_PROGRESS',
      'Permanent deletion of this user is already running.',
      409,
    );
  }

  try {
    // Re-check under the lock: the account may have been recovered meanwhile.
    const fresh = await User.findById(userId).select('_id isDeleted').lean();
    if (!fresh) return { deleted: true }; // finished by an earlier attempt
    if (!fresh.isDeleted) {
      throw new PurgeError(
        'NOT_SOFT_DELETED',
        'Soft-delete the user before deleting them permanently.',
        409,
      );
    }

    // From here on the account must never be recovered half-deleted.
    await redisClient.set(purgeMarkerKey(userId), new Date().toISOString());

    await deleteAllSessionsForUser(String(userId));
    await releaseWorkspacesOfUser(userId);
    await purgeFiles(userId);
    await purgePendingUploadObjects(userId);
    await Share.deleteMany({ ownerId: userId });
    await Share.deleteMany({ sharedWithUserId: userId });
    await deleteInsightsForUser(userId);
    await purgeAvatars(String(userId), user.picture);
    await Subscription.deleteMany({ userId });
    await Directory.deleteMany({ userId });
    // Payments are retained on purpose (financial records).

    const { deletedCount } = await User.deleteOne({ _id: userId, isDeleted: true });
    if (!deletedCount && (await User.exists({ _id: userId }))) {
      throw new Error('user document could not be removed');
    }
    await redisClient.del(purgeMarkerKey(userId));
    return { deleted: true };
  } finally {
    await releaseLock(userId, lock);
  }
}
