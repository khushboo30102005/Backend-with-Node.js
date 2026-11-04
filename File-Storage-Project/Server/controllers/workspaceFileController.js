import path from 'path';
import mongoose from 'mongoose';
import { once } from 'events';
import { PassThrough } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3, { BUCKET_NAME } from '../config/b2.js';
import Workspace from '../models/workspaceModel.js';
import WorkspaceFile from '../models/workspaceFileModel.js';
import WorkspaceFolder from '../models/workspaceFolderModel.js';
import WorkspaceVisit from '../models/workspaceVisitModel.js';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import { updateDirectorySize } from '../utils/updateDirectorySize.js';
import { getFileAccess } from '../utils/fileAccess.js';
import {
  MAX_FOLDERS,
  MAX_FOLDER_DEPTH,
  WORKSPACE_MAX_BYTES,
  WORKSPACE_USER_MAX_BYTES,
  canPerformWs,
} from '../utils/workspaceAccess.js';
import { authorize, firstZodError } from '../utils/workspaceHttp.js';
import { logActivity } from '../utils/workspaceActivity.js';
import { workspaceObjectKey } from '../services/workspaceCleanupService.js';
import { ownerWorkspaceBytes } from './workspaceController.js';
import {
  createFolderSchema,
  importFileSchema,
  moveFileSchema,
  renameFolderSchema,
  renameWorkspaceFileSchema,
  saveToDriveSchema,
} from '../validator/workspaceSchema.js';

const isId = (v) => mongoose.isValidObjectId(v);

// ------------------------------------------------------------------- quota

const releaseQuota = (workspaceId, bytes) =>
  bytes > 0
    ? Workspace.updateOne({ _id: workspaceId }, { $inc: { size: -bytes } }).catch(() => {})
    : Promise.resolve();

// Reserves `bytes` against (1) the workspace's own quota and (2) the owner's
// total across all their workspaces. Reservation is atomic and only succeeds
// while the workspace is still active, so parallel uploads can't overshoot.
async function reserveQuota(workspace, bytes) {
  const ok = await Workspace.findOneAndUpdate(
    {
      _id: workspace._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
      size: { $lte: WORKSPACE_MAX_BYTES - bytes },
    },
    { $inc: { size: bytes } },
  ).lean();
  if (!ok) {
    return { status: 413, error: 'Not enough workspace storage space, or the workspace has expired.' };
  }
  const total = await ownerWorkspaceBytes(workspace.ownerId); // includes this reservation
  if (total > WORKSPACE_USER_MAX_BYTES) {
    await releaseQuota(workspace._id, bytes);
    return { status: 413, error: "The workspace owner has reached their total workspace storage limit." };
  }
  return null;
}

// A new file only becomes visible if the workspace is still active when the
// bytes are safely stored (it may have expired mid-upload).
async function publishFile(workspaceId, fileDoc) {
  const stillActive = await Workspace.exists({
    _id: workspaceId,
    status: 'active',
    expiresAt: { $gt: new Date() },
  });
  if (!stillActive) return false;
  const r = await WorkspaceFile.updateOne({ _id: fileDoc._id }, { $set: { isReady: true } });
  return r.matchedCount > 0;
}

async function findFolder(workspaceId, folderId) {
  if (!folderId) return null;
  if (!isId(folderId)) return undefined;
  return (await WorkspaceFolder.findOne({ _id: folderId, workspaceId }).lean()) ?? undefined;
}

// ----------------------------------------------------------------- folders

async function breadcrumbOf(workspaceId, folder) {
  const trail = [];
  let cur = folder;
  for (let i = 0; cur && i < MAX_FOLDER_DEPTH + 2; i++) {
    trail.unshift({ _id: cur._id, name: cur.name });
    cur = cur.parentId ? await WorkspaceFolder.findOne({ _id: cur.parentId, workspaceId }).lean() : null;
  }
  return trail;
}

async function depthOf(workspaceId, folder) {
  return (await breadcrumbOf(workspaceId, folder)).length;
}

// Every folder id at or below `rootId` (breadth-first).
async function subtreeIds(workspaceId, rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length && ids.length <= MAX_FOLDERS) {
    const kids = await WorkspaceFolder.find({ workspaceId, parentId: { $in: frontier } })
      .select('_id')
      .lean();
    frontier = kids.map((k) => k._id);
    ids.push(...frontier);
  }
  return ids;
}

// GET /workspace/:id/folders — flat list, used by the "Move to…" picker.
export const listFolders = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;
    const folders = await WorkspaceFolder.find({ workspaceId: access.workspace._id })
      .select('name parentId')
      .sort({ name: 1 })
      .lean();
    return res.status(200).json(folders);
  } catch (err) {
    next(err);
  }
};

export const createFolder = async (req, res, next) => {
  const parsed = createFolderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });
  try {
    const access = await authorize(req, res, 'upload', { write: true });
    if (!access) return;
    const wsId = access.workspace._id;

    const parent = await findFolder(wsId, parsed.data.parentId);
    if (parent === undefined) return res.status(404).json({ error: 'Folder not found.' });
    if (parent && (await depthOf(wsId, parent)) >= MAX_FOLDER_DEPTH) {
      return res.status(400).json({ error: `Folders can be nested at most ${MAX_FOLDER_DEPTH} levels deep.` });
    }
    if ((await WorkspaceFolder.countDocuments({ workspaceId: wsId })) >= MAX_FOLDERS) {
      return res.status(400).json({ error: `A workspace can have at most ${MAX_FOLDERS} folders.` });
    }
    const folder = await WorkspaceFolder.create({
      workspaceId: wsId,
      parentId: parent?._id ?? null,
      name: parsed.data.name,
      createdBy: req.user._id,
    });
    await logActivity(wsId, req.user._id, 'folder_created', { targetName: folder.name });
    return res.status(201).json({ _id: folder._id, message: 'Folder created' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A folder with that name already exists here.' });
    next(err);
  }
};

export const renameFolder = async (req, res, next) => {
  const parsed = renameFolderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });
  try {
    const access = await authorize(req, res, 'rename', { write: true });
    if (!access) return;
    const folder = await WorkspaceFolder.findOneAndUpdate(
      { _id: req.params.folderId, workspaceId: access.workspace._id },
      { $set: { name: parsed.data.name } },
    ).lean();
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });
    await logActivity(access.workspace._id, req.user._id, 'folder_renamed', {
      targetName: parsed.data.name,
      detail: folder.name,
    });
    return res.status(200).json({ message: 'Renamed' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A folder with that name already exists here.' });
    next(err);
  }
};

// Deletes B2 objects in batches of 1000; throws if B2 reports any failure so
// database rows are only removed once their objects are really gone.
async function deleteObjects(workspaceId, files) {
  for (let i = 0; i < files.length; i += 1000) {
    const batch = files.slice(i, i + 1000);
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: batch.map((f) => ({ Key: workspaceObjectKey(workspaceId, f) })),
          Quiet: true,
        },
      }),
    );
    if (res.Errors?.length) throw new Error(res.Errors[0].Message || 'B2 delete failed');
  }
}

// Owner: deletes the folder and everything inside it.
// Editor: only a folder they created that is still empty.
export const deleteFolder = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'deleteOwn', { write: true });
    if (!access) return;
    const wsId = access.workspace._id;
    const folder = await WorkspaceFolder.findOne({ _id: req.params.folderId, workspaceId: wsId }).lean();
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });

    const ids = await subtreeIds(wsId, folder._id);
    const files = await WorkspaceFile.find({ workspaceId: wsId, folderId: { $in: ids } })
      .select('_id extension size')
      .lean();

    const isOwner = canPerformWs(access.role, 'deleteAny');
    if (!isOwner) {
      const mine = String(folder.createdBy) === String(req.user._id);
      if (!mine || ids.length > 1 || files.length > 0) {
        return res.status(403).json({ error: 'Only the owner can delete a folder that has contents.' });
      }
    }

    await deleteObjects(wsId, files);
    await WorkspaceFile.deleteMany({ _id: { $in: files.map((f) => f._id) } });
    await releaseQuota(wsId, files.reduce((n, f) => n + f.size, 0));
    await WorkspaceFolder.deleteMany({ _id: { $in: ids }, workspaceId: wsId });
    await logActivity(wsId, req.user._id, 'folder_deleted', {
      targetName: folder.name,
      detail: files.length ? `${files.length} file(s) removed` : '',
    });
    return res.status(200).json({ message: 'Folder deleted' });
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------- files

// GET /workspace/:id/files?folderId=
export const listWorkspaceFiles = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;
    const { workspace, role, readOnly } = access;

    const current = await findFolder(workspace._id, req.query.folderId);
    if (current === undefined) return res.status(404).json({ error: 'Folder not found.' });
    const parentId = current?._id ?? null;

    const [folders, files, breadcrumb] = await Promise.all([
      WorkspaceFolder.find({ workspaceId: workspace._id, parentId }).sort({ name: 1 }).lean(),
      WorkspaceFile.find({ workspaceId: workspace._id, folderId: parentId, isReady: true })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name')
        .lean(),
      current ? breadcrumbOf(workspace._id, current) : [],
    ]);

    // Listing the files = having seen them: clears the "new files" and
    // "expiring soon" notifications (the expiry is acknowledged as it stands).
    await WorkspaceVisit.updateOne(
      { workspaceId: workspace._id, userId: req.user._id },
      { $set: { lastSeenAt: new Date(), ackedExpiry: workspace.expiresAt } },
      { upsert: true },
    ).catch(() => {});

    const me = String(req.user._id);
    return res.status(200).json({
      folder: current ? { _id: current._id, name: current.name } : null,
      breadcrumb,
      folders: folders.map((f) => ({
        _id: f._id,
        name: f.name,
        createdAt: f.createdAt,
        canRename: !readOnly && canPerformWs(role, 'rename'),
        canDelete:
          !readOnly &&
          (canPerformWs(role, 'deleteAny') ||
            (canPerformWs(role, 'deleteOwn') && String(f.createdBy) === me)),
      })),
      files: files.map((f) => {
        const mine = String(f.uploadedBy?._id) === me;
        return {
          _id: f._id,
          name: f.name,
          size: f.size,
          extension: f.extension,
          uploadedBy: f.uploadedBy ? { _id: f.uploadedBy._id, name: f.uploadedBy.name } : null,
          createdAt: f.createdAt,
          canRename: !readOnly && canPerformWs(role, 'rename'),
          canMove: !readOnly && (canPerformWs(role, 'deleteAny') || (mine && canPerformWs(role, 'deleteOwn'))),
          canDelete:
            !readOnly && (canPerformWs(role, 'deleteAny') || (mine && canPerformWs(role, 'deleteOwn'))),
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};

export const uploadWorkspaceFile = async (req, res, next) => {
  let fileDoc;
  let key;
  let reserved = 0;
  let wsId;

  try {
    const access = await authorize(req, res, 'upload', { write: true });
    if (!access) return;
    wsId = access.workspace._id;

    const filename = path.basename(String(req.headers.filename || 'untitled')).slice(0, 255) || 'untitled';
    const filesize = Number(req.headers.filesize);
    if (!Number.isFinite(filesize) || filesize < 0) {
      return res.status(400).json({ error: 'Invalid filesize' });
    }
    const folder = await findFolder(wsId, req.headers.folderid);
    if (folder === undefined) return res.status(404).json({ error: 'Folder not found.' });

    const denied = await reserveQuota(access.workspace, filesize);
    if (denied) return res.status(denied.status).json({ error: denied.error });
    reserved = filesize;

    const extension = path.extname(filename);
    fileDoc = await WorkspaceFile.create({
      workspaceId: wsId,
      folderId: folder?._id ?? null,
      name: filename,
      size: filesize,
      extension,
      uploadedBy: req.user._id,
    });
    key = workspaceObjectKey(wsId, fileDoc);

    let total = 0;
    const body = new PassThrough();
    const writer = (async () => {
      for await (const chunk of req) {
        total += chunk.length;
        if (total > filesize) {
          const err = new Error('FILESIZE_EXCEEDED');
          body.destroy(err);
          throw err;
        }
        if (!body.write(chunk)) await once(body, 'drain');
      }
      body.end();
    })();

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: req.headers['content-type'] || 'application/octet-stream',
      },
    });
    await Promise.all([writer, upload.done()]);
    if (total !== filesize) throw new Error('FILESIZE_MISMATCH');

    if (!(await publishFile(wsId, fileDoc))) throw new Error('WORKSPACE_EXPIRED');
    await logActivity(wsId, req.user._id, 'file_uploaded', { targetName: filename });
    return res.status(201).json({ message: 'File Uploaded' });
  } catch (err) {
    if (fileDoc) await WorkspaceFile.deleteOne({ _id: fileDoc._id }).catch(() => {});
    if (key) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })).catch(() => {});
    }
    if (reserved) await releaseQuota(wsId, reserved);
    if (res.headersSent) return;
    if (err.message === 'FILESIZE_EXCEEDED' || err.message === 'FILESIZE_MISMATCH') {
      return res.status(400).json({ error: 'Uploaded file size does not match the declared size.' });
    }
    if (err.message === 'WORKSPACE_EXPIRED') {
      return res
        .status(410)
        .json({ error: 'This workspace expired during the upload.', code: 'WORKSPACE_EXPIRED' });
    }
    next(err);
  }
};

// POST /workspace/:id/files/import — copy one of the user's My Drive files in.
export const importFromDrive = async (req, res, next) => {
  const parsed = importFileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  let fileDoc;
  let key;
  let reserved = 0;
  let wsId;
  try {
    const access = await authorize(req, res, 'upload', { write: true });
    if (!access) return;
    wsId = access.workspace._id;

    // Same access rule as viewing/downloading the file in My Drive.
    const source = await getFileAccess(parsed.data.fileId, req.user._id);
    if (!source) return res.status(404).json({ error: 'File not found!' });
    const src = source.file;

    const folder = await findFolder(wsId, parsed.data.folderId);
    if (folder === undefined) return res.status(404).json({ error: 'Folder not found.' });

    const denied = await reserveQuota(access.workspace, src.size);
    if (denied) return res.status(denied.status).json({ error: denied.error });
    reserved = src.size;

    fileDoc = await WorkspaceFile.create({
      workspaceId: wsId,
      folderId: folder?._id ?? null,
      name: src.name,
      size: src.size,
      extension: src.extension,
      uploadedBy: req.user._id,
    });
    key = workspaceObjectKey(wsId, fileDoc);
    const srcKey = `${src._id}${src.extension}`;
    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        CopySource: `${BUCKET_NAME}/${encodeURIComponent(srcKey)}`,
      }),
    );

    if (!(await publishFile(wsId, fileDoc))) throw new Error('WORKSPACE_EXPIRED');
    await logActivity(wsId, req.user._id, 'file_imported', { targetName: src.name });
    return res.status(201).json({ message: 'File added to workspace' });
  } catch (err) {
    if (fileDoc) await WorkspaceFile.deleteOne({ _id: fileDoc._id }).catch(() => {});
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })).catch(() => {});
    if (reserved) await releaseQuota(wsId, reserved);
    if (res.headersSent) return;
    if (err.message === 'WORKSPACE_EXPIRED') {
      return res.status(410).json({ error: 'This workspace expired.', code: 'WORKSPACE_EXPIRED' });
    }
    next(err);
  }
};

const findFile = (workspaceId, fileId) =>
  WorkspaceFile.findOne({ _id: fileId, workspaceId, isReady: true });

// POST /workspace/:id/files/:fileId/save-to-drive — copy a workspace file into
// the user's My Drive (counts against their personal storage). Allowed to
// anyone who can view/download it, including the owner of an archive.
export const saveToDrive = async (req, res, next) => {
  const parsed = saveToDriveSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  let newFile;
  let key;
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;
    const wsId = access.workspace._id;

    const src = await findFile(wsId, req.params.fileId).lean();
    if (!src) return res.status(404).json({ error: 'File not found!' });

    const dir = await Directory.findOne({
      _id: parsed.data.dirId || req.user.rootDirId,
      userId: req.user._id,
      isTrashed: { $ne: true },
    }).lean();
    if (!dir) return res.status(404).json({ error: 'Destination folder not found.' });

    const root = await Directory.findById(req.user.rootDirId).select('size').lean();
    if ((root?.size ?? 0) + src.size > req.user.maxStorageInBytes) {
      return res.status(413).json({ error: 'Not enough space in your My Drive.' });
    }

    newFile = await File.create({
      name: src.name,
      size: src.size,
      extension: src.extension,
      userId: req.user._id,
      parentDirId: dir._id,
    });
    key = `${newFile._id}${src.extension}`;
    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        CopySource: `${BUCKET_NAME}/${encodeURIComponent(workspaceObjectKey(wsId, src))}`,
      }),
    );
    await updateDirectorySize(dir._id, src.size);
    await logActivity(wsId, req.user._id, 'file_saved_to_drive', { targetName: src.name });
    return res.status(201).json({ message: 'Saved to My Drive' });
  } catch (err) {
    if (newFile) await File.deleteOne({ _id: newFile._id }).catch(() => {});
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })).catch(() => {});
    next(err);
  }
};

export const getWorkspaceFile = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'view');
    if (!access) return;

    const file = await findFile(access.workspace._id, req.params.fileId).lean();
    if (!file) return res.status(404).json({ error: 'File not found!' });

    const key = workspaceObjectKey(access.workspace._id, file);
    const isDownload = req.query.action === 'download';

    if (req.query.format === 'text') {
      if (file.size > 2 * 1024 * 1024) {
        return res.status(413).json({ error: 'File is too large to preview.' });
      }
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
      return res.type('text/plain; charset=utf-8').send(await obj.Body.transformToString());
    }

    // Short-lived URL: a removal or expiry after this point only keeps
    // working for these few seconds.
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.name)}"`,
      }),
      { expiresIn: 60 },
    );
    if (req.query.format === 'json') return res.json({ url });
    return res.redirect(url);
  } catch (err) {
    next(err);
  }
};

export const renameWorkspaceFile = async (req, res, next) => {
  const parsed = renameWorkspaceFileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'rename', { write: true });
    if (!access) return;
    const before = await WorkspaceFile.findOneAndUpdate(
      { _id: req.params.fileId, workspaceId: access.workspace._id, isReady: true },
      { $set: { name: parsed.data.newFilename } },
    ).lean();
    if (!before) return res.status(404).json({ error: 'File not found!' });
    await logActivity(access.workspace._id, req.user._id, 'file_renamed', {
      targetName: parsed.data.newFilename,
      detail: before.name,
    });
    return res.status(200).json({ message: 'Renamed' });
  } catch (err) {
    next(err);
  }
};

export const moveWorkspaceFile = async (req, res, next) => {
  const parsed = moveFileSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: firstZodError(parsed) });

  try {
    const access = await authorize(req, res, 'deleteOwn', { write: true });
    if (!access) return;
    const wsId = access.workspace._id;

    const file = await findFile(wsId, req.params.fileId).lean();
    if (!file) return res.status(404).json({ error: 'File not found!' });
    if (String(file.uploadedBy) !== String(req.user._id) && !canPerformWs(access.role, 'deleteAny')) {
      return res.status(403).json({ error: 'You can only move files you uploaded.' });
    }
    const dest = await findFolder(wsId, parsed.data.folderId);
    if (dest === undefined) return res.status(404).json({ error: 'Folder not found.' });

    await WorkspaceFile.updateOne({ _id: file._id }, { $set: { folderId: dest?._id ?? null } });
    await logActivity(wsId, req.user._id, 'file_moved', {
      targetName: file.name,
      detail: dest ? dest.name : 'Workspace root',
    });
    return res.status(200).json({ message: 'File moved' });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkspaceFile = async (req, res, next) => {
  try {
    const access = await authorize(req, res, 'deleteOwn', { write: true });
    if (!access) return;

    const file = await findFile(access.workspace._id, req.params.fileId).lean();
    if (!file) return res.status(404).json({ error: 'File not found!' });

    const mine = String(file.uploadedBy) === String(req.user._id);
    if (!mine && !canPerformWs(access.role, 'deleteAny')) {
      return res.status(403).json({ error: 'You can only delete files you uploaded.' });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: workspaceObjectKey(access.workspace._id, file),
      }),
    );
    const del = await WorkspaceFile.deleteOne({ _id: file._id });
    if (del.deletedCount) await releaseQuota(access.workspace._id, file.size);
    await logActivity(access.workspace._id, req.user._id, 'file_deleted', { targetName: file.name });
    return res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
};
