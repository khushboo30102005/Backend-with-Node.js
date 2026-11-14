import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3, { BUCKET_NAME } from '../config/b2.js';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import { updateDirectorySize } from '../utils/updateDirectorySize.js';

// ---------------------------------------------------------------------------
// My Drive quota reservations.
//
// A user's used storage is their root directory's `size`. An upload reserves
// its bytes BEFORE any data is streamed, with one conditional update on that
// single document:
//
//     root.size <= limit - bytes   →   size += bytes, push a pendingUploads entry
//
// MongoDB applies a single-document update atomically, so parallel uploads
// can never reserve more than the remaining quota, and a reservation can
// never exist without its bytes being counted (or the other way round).
//
//   success  → commitReservation(): the file document is created, the entry is
//              removed (its bytes stay in root.size as used storage) and the
//              folders between the parent and the root are charged.
//   failure  → releaseReservation(): entry removed and bytes given back, once.
//   crash    → the sweeper releases entries whose heartbeat stopped.
// ---------------------------------------------------------------------------

const minutes = (v, fallback) => (Number(v) > 0 ? Number(v) : fallback) * 60 * 1000;

// An in-flight upload refreshes its entry every HEARTBEAT_MS. Entries not
// refreshed for STALE_MS belong to a request that no longer exists.
export const RESERVATION_STALE_MS = minutes(process.env.UPLOAD_RESERVATION_STALE_MINUTES, 30);
export const RESERVATION_HEARTBEAT_MS = Math.min(60 * 1000, Math.floor(RESERVATION_STALE_MS / 3));
const SWEEP_INTERVAL_MS = minutes(process.env.UPLOAD_RESERVATION_SWEEP_MINUTES, 5);

export const UPLOAD_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export class QuotaError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SCHEMA_OUT_OF_DATE =
  '[storage] MongoDB rejected the upload reservation (validation error 121). ' +
  'The directories validator predates pendingUploads: run `npm run setup` once.';

/**
 * Atomically reserves `bytes` of the user's quota.
 * Returns the reservation, or throws QuotaError (413 no space, 409 duplicate).
 */
export async function reserveStorage({
  rootDirId,
  bytes,
  limit,
  fileId = null,
  objectKey = null,
  uploadId = null,
}) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    throw new QuotaError(400, 'Invalid filesize');
  }
  if (!Number.isFinite(limit) || bytes > limit) {
    throw new QuotaError(413, 'Not enough storage space available.', 'QUOTA_EXCEEDED');
  }

  // A negative used size is always an accounting error (it would read as
  // extra free space), so treat it as zero before checking the quota.
  await Directory.updateOne({ _id: rootDirId, size: { $lt: 0 } }, { $set: { size: 0 } });

  const entry = {
    id: randomUUID(),
    bytes,
    fileId,
    objectKey,
    uploadId,
    at: new Date(),
  };
  const filter = { _id: rootDirId, size: { $lte: limit - bytes } };
  // The same upload id can't hold two reservations at once (a retried or
  // duplicated request while the first one is still streaming).
  if (uploadId) filter['pendingUploads.uploadId'] = { $ne: uploadId };

  let reserved;
  try {
    reserved = await Directory.findOneAndUpdate(
      filter,
      { $inc: { size: bytes }, $push: { pendingUploads: entry } },
      { new: true },
    )
      .select('_id')
      .lean();
  } catch (err) {
    if (err?.code === 121) {
      console.error(SCHEMA_OUT_OF_DATE);
      throw new QuotaError(503, 'Uploads are temporarily unavailable. Please try again later.');
    }
    throw err;
  }

  if (!reserved) {
    if (uploadId && (await Directory.exists({ _id: rootDirId, 'pendingUploads.uploadId': uploadId }))) {
      throw new QuotaError(409, 'This upload is already in progress.', 'UPLOAD_IN_PROGRESS');
    }
    if (!(await Directory.exists({ _id: rootDirId }))) {
      throw new Error(`Root directory ${rootDirId} not found`);
    }
    throw new QuotaError(413, 'Not enough storage space available.', 'QUOTA_EXCEEDED');
  }

  return { rootDirId, id: entry.id, bytes, fileId, objectKey };
}

/** Marks the reservation as still in use. Returns false if it is gone. */
export async function touchReservation(reservation) {
  const r = await Directory.updateOne(
    { _id: reservation.rootDirId, 'pendingUploads.id': reservation.id },
    { $set: { 'pendingUploads.$.at': new Date() } },
  );
  return r.matchedCount > 0;
}

/**
 * Gives the reserved bytes back. Idempotent: only the call that actually
 * removes the entry changes `size`, so a double release can't under-count.
 * `onlyIfStaleBefore` limits it to an entry whose heartbeat is older (sweeper).
 */
export async function releaseReservation(reservation, { onlyIfStaleBefore = null } = {}) {
  const match = { id: reservation.id };
  if (onlyIfStaleBefore) match.at = { $lt: onlyIfStaleBefore };
  const base = { _id: reservation.rootDirId, pendingUploads: { $elemMatch: match } };
  const pull = { $pull: { pendingUploads: { id: reservation.id } } };

  for (let attempt = 0; attempt < 3; attempt++) {
    const dec = await Directory.updateOne(
      { ...base, size: { $gte: reservation.bytes } },
      { ...pull, $inc: { size: -reservation.bytes } },
    );
    if (dec.modifiedCount) return true;
    // Size already lower than the reservation (drift): release to zero.
    const clamp = await Directory.updateOne(
      { ...base, size: { $lt: reservation.bytes } },
      { ...pull, $set: { size: 0 } },
    );
    if (clamp.modifiedCount) return true;
    if (!(await Directory.exists(base))) return false; // already released / committed
  }
  return false;
}

/**
 * Turns a reservation into a stored file. `fileDoc` must carry the `_id` that
 * was used for the B2 object key and the exact, verified `size`.
 * Throws QuotaError(410) if the reservation was already released (for example
 * the sweeper reclaimed it); the caller then removes the B2 object.
 */
export async function commitReservation(reservation, fileDoc) {
  if (fileDoc.size !== reservation.bytes) {
    throw new Error('commitReservation: size does not match the reservation');
  }
  const created = await File.create(fileDoc);

  // Claim the entry. Its bytes stay in root.size, now as used storage.
  const claimed = await Directory.updateOne(
    { _id: reservation.rootDirId, 'pendingUploads.id': reservation.id },
    { $pull: { pendingUploads: { id: reservation.id } } },
  );
  if (!claimed.modifiedCount) {
    await File.deleteOne({ _id: created._id }).catch(() => {});
    throw new QuotaError(410, 'The upload took too long and was cancelled. Please try again.', 'RESERVATION_EXPIRED');
  }

  // The root was charged at reservation time; charge the folders in between.
  await updateDirectorySize(fileDoc.parentDirId, fileDoc.size, {
    stopAt: reservation.rootDirId,
  });
  return created;
}

// ---------------------------------------------------------------------------
// Sweeper: reservations whose request died (crash, restart, lost connection
// the server never noticed). Only entries whose heartbeat stopped are touched.
// ---------------------------------------------------------------------------
export async function sweepStaleReservations(now = new Date()) {
  const cutoff = new Date(now.getTime() - RESERVATION_STALE_MS);
  const roots = await Directory.find({ 'pendingUploads.at': { $lt: cutoff } })
    .select('+pendingUploads')
    .limit(100)
    .lean();

  let released = 0;
  for (const root of roots) {
    for (const p of root.pendingUploads || []) {
      if (!(new Date(p.at) < cutoff)) continue;
      const reservation = { rootDirId: root._id, id: p.id, bytes: p.bytes };
      // The atomic release is the gate: if the upload committed (or was
      // released) in the meantime, nothing below runs.
      if (!(await releaseReservation(reservation, { onlyIfStaleBefore: cutoff }))) continue;
      released += 1;
      // A crash between creating the file document and claiming the entry
      // would leave an uncharged file behind; remove it with its object.
      if (p.fileId) await File.deleteOne({ _id: p.fileId }).catch(() => {});
      if (p.objectKey) {
        await s3
          .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: p.objectKey }))
          .catch((err) =>
            console.error(`[storage] could not delete stale object ${p.objectKey}:`, err.message),
          );
      }
    }
  }
  return released;
}

export function startStorageReservationSweeper() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const n = await sweepStaleReservations();
      if (n) console.log(`[storage] released ${n} stale upload reservation(s)`);
    } catch (err) {
      console.error('[storage] reservation sweep failed:', err.message);
    } finally {
      running = false;
    }
  };
  tick();
  setInterval(tick, SWEEP_INTERVAL_MS).unref();
}
