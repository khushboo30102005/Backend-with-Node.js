import Directory from '../models/directoryModel.js';

// Walks from `parentId` up to the root, applying `deltaSize` to every
// ancestor. Uses an atomic $inc per directory instead of read → modify →
// save, so parallel operations (bulk move/delete, Empty Trash) can't
// overwrite each other's updates.
export async function updateDirectorySize(parentId, deltaSize) {
  while (parentId) {
    const dir = await Directory.findByIdAndUpdate(
      parentId,
      { $inc: { size: deltaSize } },
      { new: true },
    )
      .select('parentDirId')
      .lean();

    if (!dir) break;
    parentId = dir.parentDirId;
  }
}