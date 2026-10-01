import mongoose from 'mongoose';
import z from 'zod';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import Share from '../models/shareModel.js';
import {
  createDirectorySchema,
  renameDirectorySchema,
} from '../validator/authSchema.js';
import s3, { BUCKET_NAME } from '../config/b2.js';
import { updateDirectorySize } from '../utils/updateDirectorySize.js';

// Collects every directory and file nested under `rootId` (not including
// `rootId` itself). Shared by trash, restore and permanent delete.
async function collectSubtree(rootId, fileFields = '_id') {
  let dirs = await Directory.find({ parentDirId: rootId }).select('_id');
  let files = await File.find({ parentDirId: rootId }).select(fileFields);
  for (const { _id } of dirs) {
    const { files: childFiles, dirs: childDirs } = await collectSubtree(
      _id,
      fileFields,
    );
    files = [...files, ...childFiles];
    dirs = [...dirs, ...childDirs];
  }
  return { files, dirs };
}

export const createDirectory = async (req, res, next) => {
  const user = req.targetUser;

  const parentDirId = req.params.parentDirId || user.rootDirId.toString();

  const dirname = req.headers.dirname || 'New Folder';

  // Validate the value coming from the header
  const { success, data, error } = createDirectorySchema.safeParse({
    dirname,
  });

  if (!success) {
    return res.status(400).json({
      error: Object.values(z.flattenError(error).fieldErrors).flat()[0],
    });
  }

  const { dirname: cleanDirname } = data;

  try {
    const parentDir = await Directory.findOne({
      _id: parentDirId,
      userId: user._id,
      isTrashed: { $ne: true },
    }).lean();

    if (!parentDir) {
      return res.status(404).json({
        message: 'Parent Directory does not exist!',
      });
    }

    const newDirId = new mongoose.Types.ObjectId();
    // create() (not insertOne) so Mongoose's timestamps option actually
    // populates createdAt/updatedAt.
    await Directory.create({
      _id: newDirId,
      name: cleanDirname,
      parentDirId,
      userId: user._id,
      path: [...parentDir.path, newDirId],
    });

    return res.status(201).json({
      message: 'Directory Created!',
    });
  } catch (err) {
    if (err.code === 121 || err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid directory values.',
      });
    }

    next(err);
  }
};

export const getDirectoryById = async (req, res, next) => {
  const targetUser = req.targetUser;
  const _id = req.params.id || targetUser.rootDirId.toString();
  try {
    const directoryData = await Directory.findOne({
      _id,
      userId: targetUser._id,
      isTrashed: { $ne: true },
    }).lean();
    if (!directoryData) {
      return res.status(404).json({
        error: 'Directory not found or you do not have access to it!',
      });
    }

    // Get all directories used in the current directory's path
    const pathDirectories = await Directory.find({
      _id: { $in: directoryData.path },
      userId: targetUser._id,
    })
      .select('_id name')
      .lean();

    const directoryMap = new Map(
      pathDirectories.map((directory) => [
        directory._id.toString(),
        directory,
      ]),
    );

    const rootIdStr = targetUser.rootDirId.toString();

    // Build breadcrumb while preserving directoryData.path order
    let breadcrumb = directoryData.path
      .map((id) => {
        const directory = directoryMap.get(id.toString());
        if (!directory) return null;
        return {
          id: directory._id,
          name: id.toString() === rootIdStr ? 'My Drive' : directory.name,
        };
      })
      .filter(Boolean);

   if (breadcrumb.length === 0) {
  breadcrumb =
    directoryData._id.toString() === rootIdStr
      ? [{ id: directoryData._id, name: 'My Drive' }]
      : [{ id: directoryData._id, name: directoryData.name }];
}
    // Trashed items never appear in normal browsing
    const files = await File.find({
      parentDirId: directoryData._id,
      userId: targetUser._id,
      isTrashed: { $ne: true },
    }).lean();

    const directories = await Directory.find({
      parentDirId: directoryData._id,
      userId: targetUser._id,
      isTrashed: { $ne: true },
    }).lean();

    return res.status(200).json({
      ...directoryData,
      breadcrumb,
      files: files.map((file) => ({
        ...file,
        id: file._id,
      })),
      directories: directories.map((directory) => ({
        ...directory,
        id: directory._id,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const renameDirectory = async (req, res, next) => {
  const user = req.targetUser;
  const { id } = req.params;
  const { success, data, error } = renameDirectorySchema.safeParse(req.body);

  if (!success) {
    return res.status(400).json({
      error: Object.values(z.flattenError(error).fieldErrors).flat()[0],
    });
  }

  const { newDirName } = data;
  if (typeof newDirName !== 'string' || newDirName.trim().length < 3) {
    return res.status(400).json({ error: 'Invalid directory name' });
  }
  try {
    const updated = await Directory.findOneAndUpdate(
      { _id: id, userId: user._id, isTrashed: { $ne: true } },
      { name: newDirName },
      { runValidators: true },
    );
    if (!updated) {
      return res.status(404).json({ error: 'Directory not found.' });
    }
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

// DELETE /directory/:id — moves the directory (and everything inside it)
// to Trash. Nothing is physically removed and storage stays charged.
export const deleteDirectory = async (req, res, next) => {
  const user = req.targetUser;
  const { id } = req.params;

  if (id === user.rootDirId.toString()) {
    return res
      .status(400)
      .json({ error: 'You cannot delete your root directory.' });
  }

  try {
    const directoryData = await Directory.findOne({
      _id: id,
      userId: user._id,
      isTrashed: { $ne: true },
    }).select('_id');
    if (!directoryData) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this directory!' });
    }

    const { files, dirs } = await collectSubtree(directoryData._id);
    const now = new Date();

    await Directory.updateMany(
      { _id: { $in: [directoryData._id, ...dirs.map((d) => d._id)] } },
      { isTrashed: true, trashedAt: now },
    );
    await File.updateMany(
      { _id: { $in: files.map((f) => f._id) } },
      { isTrashed: true, trashedAt: now },
    );

    return res.json({ message: 'Directory moved to trash.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /directory/:id/restore
export const restoreDirectory = async (req, res, next) => {
  const user = req.targetUser;
  const { id } = req.params;

  try {
    const directoryData = await Directory.findOne({
      _id: id,
      userId: user._id,
      isTrashed: true,
    }).select('_id');
    if (!directoryData) {
      return res.status(404).json({ error: 'Trashed directory not found.' });
    }

    const { files, dirs } = await collectSubtree(directoryData._id);

    await Directory.updateMany(
      { _id: { $in: [directoryData._id, ...dirs.map((d) => d._id)] } },
      { isTrashed: false, trashedAt: null },
    );
    await File.updateMany(
      { _id: { $in: files.map((f) => f._id) } },
      { isTrashed: false, trashedAt: null },
    );

    return res.json({ message: 'Directory restored.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /directory/:id/permanent — only allowed for items already in Trash.
// This is the old physical delete: B2 objects, DB documents, share records,
// and finally the storage the subtree was using.
export const permanentlyDeleteDirectory = async (req, res, next) => {
  const user = req.targetUser;
  const { id } = req.params;

  try {
    const directoryData = await Directory.findOne({
      _id: id,
      userId: user._id,
      isTrashed: true,
    })
      .select('_id size parentDirId')
      .lean();
    if (!directoryData) {
      return res.status(404).json({ message: 'Trashed directory not found.' });
    }

    const { files, dirs } = await collectSubtree(
      directoryData._id,
      'extension',
    );

    // Batch-delete objects from B2 (max 1000 keys per request)
    const objectKeys = files.map(({ _id, extension }) => ({
      Key: `${_id.toString()}${extension}`,
    }));

    for (let i = 0; i < objectKeys.length; i += 1000) {
      const batch = objectKeys.slice(i, i + 1000);
      if (batch.length > 0) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: { Objects: batch },
          }),
        );
      }
    }

    const fileIds = files.map(({ _id }) => _id);

    await File.deleteMany({ _id: { $in: fileIds } });
    await Share.deleteMany({ resourceId: { $in: fileIds } });
    await Directory.deleteMany({
      _id: { $in: [...dirs.map(({ _id }) => _id), directoryData._id] },
    });

    // The directory's own `size` is the total of everything inside it,
    // so every ancestor above it loses exactly that amount.
    if (directoryData.parentDirId) {
      await updateDirectorySize(directoryData.parentDirId, -directoryData.size);
    }

    return res.json({ message: 'Directory permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

export const moveDirectory = async (req, res, next) => {
  const user = req.targetUser;
  const { id } = req.params;
  const { newParentId } = req.body;

  if (!mongoose.isValidObjectId(newParentId)) {
    return res.status(400).json({ error: 'Invalid destination folder.' });
  }

  if (id === user.rootDirId.toString()) {
    return res
      .status(400)
      .json({ error: 'You cannot move your root directory.' });
  }

  try {
    const directory = await Directory.findOne({
      _id: id,
      userId: user._id,
      isTrashed: { $ne: true },
    });
    if (!directory) {
      return res.status(404).json({ error: 'Directory not found.' });
    }

    const newParent = await Directory.findOne({
      _id: newParentId,
      userId: user._id,
      isTrashed: { $ne: true },
    }).lean();
    if (!newParent) {
      return res.status(404).json({ error: 'Destination folder not found.' });
    }

    // Cycle check: can't move a folder into itself or any of its own descendants
    const movedIdStr = directory._id.toString();
    if (newParent.path.map(String).includes(movedIdStr)) {
      return res.status(400).json({
        error:
          'You cannot move a folder into itself or one of its own subfolders.',
      });
    }

    const oldParentId = directory.parentDirId;
    if (oldParentId.toString() === newParentId) {
      return res.status(200).json({ message: 'Directory Moved!' }); // no-op
    }

    const size = directory.size;
    const newPath = [...newParent.path, directory._id];

    async function collectDescendants(parentId) {
      const children = await Directory.find({ parentDirId: parentId })
        .select('_id path')
        .lean();
      let all = children;
      for (const child of children) {
        all = all.concat(await collectDescendants(child._id));
      }
      return all;
    }

    const descendants = await collectDescendants(directory._id);

    const bulkOps = [
      {
        updateOne: {
          filter: { _id: directory._id },
          update: { parentDirId: newParentId, path: newPath },
        },
      },
      ...descendants.map((desc) => {
        const oldPrefixLength = directory.path.length;
        const suffix = desc.path.slice(oldPrefixLength);
        return {
          updateOne: {
            filter: { _id: desc._id },
            update: { path: [...newPath, ...suffix] },
          },
        };
      }),
    ];

    await Directory.bulkWrite(bulkOps);

    await updateDirectorySize(oldParentId, -size);
    await updateDirectorySize(newParentId, size);

    return res.status(200).json({ message: 'Directory Moved!' });
  } catch (err) {
    next(err);
  }
};