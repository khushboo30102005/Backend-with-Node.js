import path from 'path';
import { once } from 'events';
import { PassThrough } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import {
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3, { BUCKET_NAME } from '../config/b2.js';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import Share from '../models/shareModel.js';
import { updateDirectorySize } from '../utils/updateDirectorySize.js';
import { getFileAccess, canPerform } from '../utils/fileAccess.js';
import mongoose from 'mongoose';

export const uploadFile = async (req, res, next) => {
  const user = req.targetUser;
  const rootDir = await Directory.findById(user.rootDirId).select('size').lean();
  const parentDirId = req.params.parentDirId || user.rootDirId.toString();

  let insertedFile;
  let objectKey;

  try {
    const parentDirData = await Directory.findOne({
      _id: parentDirId,
      userId: req.targetUser._id,
      isTrashed: { $ne: true },
    });

    if (!parentDirData) {
      return res.status(404).json({ error: 'Parent directory not found!' });
    }

    const filename = req.headers.filename || 'untitled';
    const filesize = Number(req.headers.filesize);

    if (!Number.isFinite(filesize) || filesize < 0) {
      return res.status(400).json({ error: 'Invalid filesize' });
    }

    const availableStorage =
      user.maxStorageInBytes - (rootDir ? rootDir.size : 0);
    const contentLength = parseInt(req.headers['content-length'], 10);

    if (
      (contentLength && contentLength > availableStorage) ||
      filesize > availableStorage
    ) {
      return res.status(413).json({ error: 'Not enough storage space available.' });
    }

    const extension = path.extname(filename);

    // create() (not insertOne) so Mongoose's timestamps option actually
    // populates createdAt/updatedAt on the new document.
    insertedFile = await File.create({
      extension,
      name: filename,
      size: filesize,
      parentDirId: parentDirData._id,
      userId: req.targetUser._id,
    });

    const fileId = insertedFile._id.toString();
    objectKey = `${fileId}${extension}`;

    let totalFileLength = 0;
    const limitedBody = new PassThrough();

    const writerPromise = (async () => {
      for await (const chunk of req) {
        totalFileLength += chunk.length;
        if (totalFileLength > filesize) {
          const err = new Error('FILESIZE_EXCEEDED');
          limitedBody.destroy(err);
          throw err;
        }
        if (!limitedBody.write(chunk)) {
          await once(limitedBody, 'drain');
        }
      }
      limitedBody.end();
    })();

    const s3Upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: limitedBody,
        ContentType: req.headers['content-type'] || 'application/octet-stream',
      },
    });

    await Promise.all([writerPromise, s3Upload.done()]);

    await updateDirectorySize(parentDirId, totalFileLength);

    return res.status(201).json({ message: 'File Uploaded' });
  } catch (err) {
    if (insertedFile) {
      await File.deleteOne({ _id: insertedFile._id }).catch(() => {});
    }
    if (objectKey) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: objectKey }))
        .catch(() => {});
    }
    if (err.message === 'FILESIZE_EXCEEDED') {
      return res.status(400).json({ error: 'Uploaded file exceeds declared size.' });
    }
    next(err);
  }
};

export const getFile = async (req, res, next) => {
  const { id } = req.params;

  try {
    const access = await getFileAccess(id, req.user._id);

    // Deliberately uniform 404 for "doesn't exist", "not shared with you",
    // and "trashed" — see utils/fileAccess.js for the info-leak reasoning.
    if (!access || !canPerform(access.role, 'view')) {
      return res.status(404).json({ error: 'File not found!' });
    }

    const fileData = access.file;
    const objectKey = `${id}${fileData.extension}`;
    const isDownload = req.query.action === 'download';

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        ResponseContentDisposition: `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileData.name)}"`,
      }),
      { expiresIn: 60 },
    );
    return res.redirect(signedUrl);
  } catch (err) {
    return res.status(404).json({ error: 'File not found!' });
  }
};

// DELETE /file/:id — moves the file to Trash. Storage stays charged and
// the file remains physically in B2 until permanently deleted.
export const deleteFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const file = await File.findOneAndUpdate(
      { _id: id, userId: req.targetUser._id, isTrashed: { $ne: true } },
      { isTrashed: true, trashedAt: new Date() },
    );
    if (!file) {
      return res.status(404).json({ error: 'File not found!' });
    }
    return res.status(200).json({ message: 'File moved to trash.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /file/:id/restore
export const restoreFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const file = await File.findOneAndUpdate(
      { _id: id, userId: req.targetUser._id, isTrashed: true },
      { isTrashed: false, trashedAt: null },
    );
    if (!file) {
      return res.status(404).json({ error: 'Trashed file not found!' });
    }
    return res.status(200).json({ message: 'File restored.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /file/:id/permanent — only allowed for files already in Trash.

export const permanentlyDeleteFile = async (req, res, next) => {
  const { id } = req.params;

  const file = await File.findOne({
    _id: id,
    userId: req.targetUser._id,
    isTrashed: true,
  });

  if (!file) {
    return res.status(404).json({ error: 'Trashed file not found!' });
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${id}${file.extension}`,
      }),
    );
    await File.deleteOne({ _id: id });
    await Share.deleteMany({ resourceId: id });
    await updateDirectorySize(file.parentDirId, -file.size);
    return res.status(200).json({ message: 'File permanently deleted.' });
  } catch (err) {
    next(err);
  }
};

export const updateFile = async (req, res, next) => {
  const { id } = req.params;

  try {
    const access = await getFileAccess(id, req.user._id);

    if (!access) {
      return res.status(404).json({ error: 'File not found!' });
    }

    if (!canPerform(access.role, 'rename')) {
      return res.status(403).json({ error: 'You do not have permission to rename this file.' });
    }

    const file = await File.findById(id);
    file.name = req.body.newFilename;
    await file.save();

    return res.status(200).json({ message: 'Renamed' });
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

export const moveFile = async (req, res, next) => {
  // Intentionally a plain ownership check, not getFileAccess/canPerform —
  // Move stays strictly owner-only (see Stage 1 design decision), since
  // an Editor moving someone else's file has no coherent meaning given the
  // destination folder must belong to the requester.
  const user = req.targetUser;
  const { id } = req.params;
  const { newParentId } = req.body;

  if (!mongoose.isValidObjectId(newParentId)) {
    return res.status(400).json({ error: 'Invalid destination folder.' });
  }

  try {
    const file = await File.findOne({
      _id: id,
      userId: user._id,
      isTrashed: { $ne: true },
    });
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const newParent = await Directory.findOne({
      _id: newParentId,
      userId: user._id,
      isTrashed: { $ne: true },
    }).lean();
    if (!newParent) {
      return res.status(404).json({ error: 'Destination folder not found.' });
    }

    const oldParentId = file.parentDirId;
    if (oldParentId.toString() === newParentId) {
      return res.status(200).json({ message: 'File Moved!' }); // no-op
    }

    file.parentDirId = newParentId;
    await file.save();

    await updateDirectorySize(oldParentId, -file.size);
    await updateDirectorySize(newParentId, file.size);

    return res.status(200).json({ message: 'File Moved!' });
  } catch (err) {
    next(err);
  }
};