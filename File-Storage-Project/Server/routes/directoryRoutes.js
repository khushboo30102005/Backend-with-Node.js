import express from 'express';
import { rm } from 'fs/promises';
import validateIdMiddleware from '../middlewares/validateIdMiddleware.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.param('parentDirId', validateIdMiddleware);

router.param('id', validateIdMiddleware);

router.post('/{:parentDirId}', async (req, res, next) => {
  const user = req.user;
  const db = req.db;
  const parentDirId = req.params.parentDirId
    ? new ObjectId(req.params.parentDirId)
    : user.rootDirId;
  const dirname = req.headers.dirname || 'New Folder';
  const dirCollection = db.collection('directories');
  try {
    const parentDir = await dirCollection.findOne({
      _id: parentDirId,
    });
    if (!parentDir)
      return res
        .status(404)
        .json({ message: 'Parent Directory Does not exist!' });

    await dirCollection.insertOne({
      name: dirname,
      parentDirId,
      userId: user._id,
    });
    return res.status(200).json({ message: 'Directory Created!' });
  } catch (err) {
    next(err);
  }
});

router.get('/{:id}', async (req, res) => {
  const db = req.db;
  const user = req.user;
  const _id = req.params.id ? new ObjectId(req.params.id) : user.rootDirId;
  const dirCollection = db.collection('directories');
  const filesCollection = db.collection('files');
  try {
    const directoryData = await dirCollection.findOne({ _id });
    if (!directoryData) {
      return res
        .status(404)
        .json({
          error: 'Directory not found or you do not have access to it!',
        });
    }
    const files = await filesCollection
      .find({ parentDirId: directoryData._id })
      .toArray();
    const directories = await dirCollection
      .find({ parentDirId: _id })
      .toArray();

    return res.status(200).json({
      ...directoryData,
      files: files.map((file) => ({ ...file, id: file._id })),
      directories: directories.map((dir) => ({ ...dir, id: dir._id })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  const user = req.user;
  const db = req.db;
  const { id } = req.params;
  const { newDirName } = req.body;
  const dirCollection = db.collection('directories');
  try {
    await dirCollection.updateOne(
      { _id: new ObjectId(id), userId: user._id },
      { $set: { name: newDirName } },
    );
    res.status(200).json({ message: 'Directory Renamed!' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const db = req.db;
  const dirsCollection = db.collection('directories');
  const filesCollection = db.collection('files');
  try {
    const directoryData = await dirsCollection.findOne(
      {
        _id: new ObjectId(id),
        userId: user._id,
      },
      { projection: { _id: 1 } },
    );
    if (!directoryData) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this directory!' });
    }
    async function getDirectoryContent(id) {
      let dirs = await dirsCollection
        .find({ parentDirId: id }, { projection: { _id: 1 } })
        .toArray();
      let files = await filesCollection
        .find({ parentDirId: id }, { projection: { extension: 1 } })
        .toArray();

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
    await filesCollection.deleteMany({
      _id: { $in: files.map(({ _id }) => _id) },
    });
    await dirsCollection.deleteMany({
      _id: { $in: [...dirs.map(({ _id }) => _id), directoryData._id] },
    });
    return res.json({
      message: 'Files or directories deleted successfully!!!',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
