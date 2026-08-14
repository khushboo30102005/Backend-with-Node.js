import { ObjectId } from 'mongodb';
import { rm } from 'fs/promises';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';

export const getDirectoryById = async (req, res, next) => {
  const targetUser = req.targetUser;
  const _id = req.params.id || targetUser.rootDirId.toString();
  try {
    const directoryData = await Directory.findOne({
      _id,
      userId: targetUser._id,
    }).lean();
    if (!directoryData) {
      return res.status(404).json({
        error: 'Directory not found or you do not have access to it!',
      });
    }
    const files = await File.find({ parentDirId: directoryData._id }).lean();
    const directories = await Directory.find({ parentDirId: _id }).lean();
    return res.status(200).json({
      ...directoryData,
      files: files.map((file) => ({ ...file, id: file._id })),
      directories: directories.map((dir) => ({ ...dir, id: dir._id })),
    });
  } catch (error) {
    next(error);
  }
};

export const renameDirectory = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const { newDirName } = req.body;
  try {
    await Directory.findOneAndUpdate(
      { _id: id, userId: req.targetUser._id },
      { name: newDirName },
      { runValidators: true },
    );
    res.status(200).json({ message: 'Directory Renamed!' });
  } catch (err) {
    if (err.code === 121) {
      return res.status(400).json({
        error: 'Directory name must be at least 3 characters long.',
      });
    }
    next(err);
  }
};

export const deleteDirectory = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  try {
    const directoryData = await Directory.findOne({
      _id: id,
      userId: req.targetUser._id,
    }).select('_id');
    if (!directoryData) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this directory!' });
    }
    async function getDirectoryContent(id) {
      let dirs = await Directory.find({ parentDirId: id }).select('_id');
      let files = await File.find({ parentDirId: id }).select('extension');
      for (const { _id } of dirs) {
        const { files: childFiles, dirs: childDirs } =
          await getDirectoryContent(_id);
        files = [...files, ...childFiles];
        dirs = [...dirs, ...childDirs];
      }
      return { files, dirs };
    }

    const { files, dirs } = await getDirectoryContent(directoryData._id);
    for (const { _id, extension } of files) {
      await rm(`./storage/${_id.toString()}${extension}`);
    }
    await File.deleteMany({
      _id: { $in: files.map(({ _id }) => _id) },
    });
    await Directory.deleteMany({
      _id: {
        $in: [...dirs.map(({ _id }) => _id), directoryData._id.toString()],
      },
    });
    return res.json({
      message: 'Files or directories deleted successfully!!!',
    });
  } catch (error) {
    next(error);
  }
};

export const createDirectory = async (req, res, next) => {
  const user = req.targetUser;
  const parentDirId = req.params.parentDirId || user.rootDirId.toString();
  const dirname = req.headers.dirname || 'New Folder';
  try {
    const parentDir = await Directory.findOne({
      _id: parentDirId,
    }).lean();
    if (!parentDir)
      return res
        .status(404)
        .json({ message: 'Parent Directory Does not exist!' });
    const newDir = await Directory.insertOne(
      {
        name: dirname,
        parentDirId,
        userId: req.targetUser._id,
      },
      { runValidators: true },
    );
    return res.status(200).json({ message: 'Directory Created!' });
  } catch (err) {
    if (err.code === 121) {
      return res.status(400).json({
        error: 'Directory name must be at least 3 characters long.',
      });
    }
    next(err);
  }
};
