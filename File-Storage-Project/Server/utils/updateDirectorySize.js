import Directory from '../models/directoryModel.js';

// Walks from `parentId` up to the root, applying `deltaSize` to every
// ancestor. Uses an atomic update per directory instead of read → modify →
// save, so parallel operations (bulk move/delete, Empty Trash) can't
// overwrite each other's updates.
//
// Decrements never take a directory below zero: a negative size is always
// wrong and, on the root directory, would read as extra free quota.
//
// `stopAt` stops before that directory (used when the root's share of the
// bytes was already charged by an upload reservation).
export async function updateDirectorySize(parentId, deltaSize, { stopAt = null } = {}) {
  const stop = stopAt ? String(stopAt) : null;
  while (parentId && deltaSize) {
    if (stop && String(parentId) === stop) break;
    const dir =
      deltaSize > 0
        ? await Directory.findOneAndUpdate(
            { _id: parentId },
            { $inc: { size: deltaSize } },
            { new: true },
          )
            .select('parentDirId')
            .lean()
        : await decrementClamped(parentId, -deltaSize);

    if (!dir) break;
    parentId = dir.parentDirId;
  }
}

async function decrementClamped(id, amount) {
  // Two conditional updates instead of one read-then-write. If a concurrent
  // change lands between them, neither matches and we simply try again.
  for (let attempt = 0; attempt < 3; attempt++) {
    const dec = await Directory.findOneAndUpdate(
      { _id: id, size: { $gte: amount } },
      { $inc: { size: -amount } },
      { new: true },
    )
      .select('parentDirId')
      .lean();
    if (dec) return dec;

    const clamped = await Directory.findOneAndUpdate(
      { _id: id, size: { $lt: amount } },
      { $set: { size: 0 } },
      { new: true },
    )
      .select('parentDirId')
      .lean();
    if (clamped) {
      console.warn(
        `[storage] directory ${id} size was below ${amount} bytes; clamped to 0 (accounting drift)`,
      );
      return clamped;
    }
  }
  return null; // directory no longer exists
}
