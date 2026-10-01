import File from '../models/fileModel.js';
import Directory from '../models/directoryModel.js';

export const getTrash = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const trashedDirs = await Directory.find({ userId, isTrashed: true }).lean();
    const trashedFiles = await File.find({ userId, isTrashed: true }).lean();

    const trashedDirIdSet = new Set(trashedDirs.map((d) => d._id.toString()));

    const topLevelDirs = trashedDirs.filter(
      (d) => !trashedDirIdSet.has(d.parentDirId?.toString()),
    );
    const topLevelFiles = trashedFiles.filter(
      (f) => !trashedDirIdSet.has(f.parentDirId?.toString()),
    );

    return res.status(200).json({
      directories: topLevelDirs.map((d) => ({ ...d, id: d._id, isDirectory: true })),
      files: topLevelFiles.map((f) => ({ ...f, id: f._id, isDirectory: false })),
    });
  } catch (err) {
    next(err);
  }
};