import { deleteInsightsForFiles } from '../ai/insightService.js';
import path from 'path';
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
import { getEffectiveStorageLimit } from '../services/subscriptionService.js';
import {
  QuotaError,
  RESERVATION_HEARTBEAT_MS,
  UPLOAD_ID_PATTERN,
  commitReservation,
  releaseReservation,
  reserveStorage,
  touchReservation,
} from '../services/storageQuotaService.js';

// POST /file/:parentDirId — streams the request body to B2.
//
// Storage accounting (audit H3 / M1):
//   1. The declared size is reserved atomically against the quota BEFORE any
//      byte is stored (services/storageQuotaService.js), so parallel uploads
//      can't overshoot the limit.
//   2. Every byte is counted while streaming; more than declared aborts at
//      once, fewer than declared is rejected after the stream ends.
//   3. Only then is the file document created, with the verified size, and
//      the reservation turned into used storage. Any failure releases the
//      reservation and removes the B2 object, so no record or object is left
//      with a size that doesn't match what was stored.
export const uploadFile = async (req, res, next) => {
  const user = req.targetUser;
  const parentDirId = req.params.parentDirId || user.rootDirId.toString();

  let reservation = null;
  let objectKey = null;
  let s3Upload = null;
  let limitedBody = null;
  let heartbeat = null;
  let committed = false;

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
    // A plain decimal byte count only ("", "1e3", "0x10" and "+5" are what
    // Number() would quietly accept).
    const rawSize = req.headers.filesize;
    const filesize = /^\d{1,16}$/.test(rawSize ?? '') ? Number(rawSize) : NaN;

    if (!Number.isSafeInteger(filesize)) {
      return res.status(400).json({ error: 'Invalid filesize' });
    }

    // When the client states a body length, it must be the declared size.
    // (Chunked bodies are checked byte by byte below instead.)
    const rawLength = req.headers['content-length'];
    if (rawLength !== undefined && Number(rawLength) !== filesize) {
      return res.status(400).json({ error: SIZE_MISMATCH_MESSAGE });
    }

    const uploadId = req.headers['upload-id'] ?? null;
    if (uploadId !== null && !UPLOAD_ID_PATTERN.test(uploadId)) {
      return res.status(400).json({ error: 'Invalid upload id.' });
    }

    const extension = path.extname(filename);
    const fileId = new mongoose.Types.ObjectId();
    const key = `${fileId}${extension}`;

    // The limit comes from MongoDB (after applying any expired Premium), never
    // from the cached session, so plan changes apply immediately.
    const storageLimit = await getEffectiveStorageLimit(user._id);
    reservation = await reserveStorage({
      rootDirId: user.rootDirId,
      bytes: filesize,
      limit: storageLimit,
      fileId,
      objectKey: key,
      uploadId,
    });
    objectKey = key;

    heartbeat = setInterval(() => {
      touchReservation(reservation).catch(() => {});
    }, RESERVATION_HEARTBEAT_MS);
    heartbeat.unref();

    let totalFileLength = 0;
    limitedBody = new PassThrough();
    const body = limitedBody;

    const writerPromise = (async () => {
      try {
        // destroyOnReturn: false keeps the socket open when we stop reading
        // early, so the 400 below can still reach the client.
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          totalFileLength += chunk.length;
          if (totalFileLength > filesize) throw new Error('FILESIZE_EXCEEDED');
          if (!body.write(chunk)) await drainOrClose(body);
          if (body.destroyed) throw new Error('UPLOAD_ABORTED');
        }
        body.end();
      } catch (err) {
        // Also stops the B2 upload when the client disconnects mid-stream.
        body.destroy();
        throw err;
      }
    })();

    s3Upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: limitedBody,
        ContentType: req.headers['content-type'] || 'application/octet-stream',
      },
    });

    await Promise.all([writerPromise, s3Upload.done()]);

    if (totalFileLength !== filesize) throw new Error('FILESIZE_MISMATCH');

    // Creates the file document (File.create, so timestamps are set) with the
    // verified size and turns the reservation into used storage.
    await commitReservation(reservation, {
      _id: fileId,
      extension,
      name: filename,
      size: totalFileLength,
      parentDirId: parentDirData._id,
      userId: req.targetUser._id,
    });
    committed = true;

    return res.status(201).json({ message: 'File Uploaded' });
  } catch (err) {
    if (!committed) {
      // Unblocks the writer if B2 failed while it was waiting to write.
      limitedBody?.destroy();
      if (s3Upload) await s3Upload.abort().catch(() => {});
      if (objectKey) {
        await s3
          .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: objectKey }))
          .catch((e) => console.error(`[storage] could not delete ${objectKey}:`, e.message));
      }
      if (reservation) {
        await releaseReservation(reservation).catch((e) =>
          // The sweeper reclaims it once the heartbeat has stopped.
          console.error('[storage] could not release reservation:', e.message),
        );
      }
    }
    // (If the client already disconnected, writing the response is a no-op.)
    if (res.headersSent) return;
    if (err.message === 'FILESIZE_EXCEEDED') {
      return res.status(400).json({ error: 'Uploaded file exceeds declared size.' });
    }
    if (err.message === 'FILESIZE_MISMATCH') {
      return res.status(400).json({ error: SIZE_MISMATCH_MESSAGE });
    }
    if (err instanceof QuotaError) {
      return res.status(err.status).json({ error: err.message, ...(err.code && { code: err.code }) });
    }
    next(err);
  } finally {
    clearInterval(heartbeat);
  }
};

const SIZE_MISMATCH_MESSAGE = 'Uploaded file size does not match the declared size.';

// Waits until the stream can take more data, or until it was destroyed (B2
// failed or the upload was aborted). `once(stream, 'drain')` alone would wait
// forever in the second case.
const drainOrClose = (stream) =>
  new Promise((resolve) => {
    const done = () => {
      stream.off('drain', done);
      stream.off('close', done);
      resolve();
    };
    stream.on('drain', done);
    stream.on('close', done);
  });

// Types the in-app viewer previews. B2 may store these with a generic
// content type, so force one the browser can render inline.
const TEXT = 'text/plain; charset=utf-8';
const PREVIEW_TYPES = {
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': TEXT, '.md': TEXT, '.json': TEXT, '.csv': TEXT, '.log': TEXT,
  '.xml': TEXT, '.yml': TEXT, '.yaml': TEXT, '.html': TEXT, '.css': TEXT,
  '.js': TEXT, '.jsx': TEXT, '.ts': TEXT, '.tsx': TEXT, '.py': TEXT, '.java': TEXT,
};

// Office files are rendered by Microsoft's hosted viewer, which fetches the URL
// from its own servers a moment after the page loads — give it a longer window.
const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024;
const OFFICE_EXTENSIONS = ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls'];

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

    // ?format=text returns the file body as text for the in-app markdown
    // viewer. Served by the API (not B2) so it needs no bucket CORS rules.
    if (req.query.format === 'text') {
      if (fileData.size > MAX_TEXT_PREVIEW_BYTES) {
        return res.status(413).json({ error: 'File is too large to preview.' });
      }
      const obj = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: objectKey }),
      );
      return res.type('text/plain; charset=utf-8').send(await obj.Body.transformToString());
    }
    const previewType =
      !isDownload && PREVIEW_TYPES[String(fileData.extension).toLowerCase()];

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        ...(previewType && { ResponseContentType: previewType }),
        ResponseContentDisposition: `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileData.name)}"`,
      }),
      {
        expiresIn:
          !isDownload &&
          OFFICE_EXTENSIONS.includes(String(fileData.extension).toLowerCase())
            ? 600
            : 60,
      },
    );
    // ?format=json lets the SPA fetch the signed URL with its session cookie
    // (a normal XHR) and open the storage URL itself, instead of navigating to
    // this API in a new tab where cross-site cookies may not be sent.
    if (req.query.format === 'json') {
      return res.json({ url: signedUrl });
    }
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
    // B2 first: deleting a missing key succeeds, so a retry after a failure
    // here is safe and nothing in the database has changed yet.
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${id}${file.extension}`,
      }),
    );
    // Only the request that actually removes the document gives the storage
    // back, so a double click or retry can't subtract the size twice.
    const { deletedCount } = await File.deleteOne({
      _id: id,
      userId: req.targetUser._id,
      isTrashed: true,
    });
    if (!deletedCount) {
      return res.status(404).json({ error: 'Trashed file not found!' });
    }
    await Share.deleteMany({ resourceId: id });
    await deleteInsightsForFiles([id]);
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

    // Conditional on the parent we read, so two concurrent moves of the same
    // file can't both adjust folder sizes.
    const moved = await File.updateOne(
      { _id: file._id, userId: user._id, parentDirId: oldParentId, isTrashed: { $ne: true } },
      { $set: { parentDirId: newParentId } },
    );
    if (!moved.modifiedCount) {
      return res.status(409).json({ error: 'The file changed. Please try again.' });
    }

    await updateDirectorySize(oldParentId, -file.size);
    await updateDirectorySize(newParentId, file.size);

    return res.status(200).json({ message: 'File Moved!' });
  } catch (err) {
    next(err);
  }
};