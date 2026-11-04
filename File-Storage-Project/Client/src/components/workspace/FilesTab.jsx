import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  FaArrowsAlt,
  FaChevronRight,
  FaCloudDownloadAlt,
  FaDownload,
  FaEdit,
  FaFolder,
  FaFolderPlus,
  FaHdd,
  FaRegFileAlt,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUpload,
} from 'react-icons/fa';
import {
  createWorkspaceFolder,
  deleteWorkspaceFile,
  deleteWorkspaceFolder,
  importDriveFile,
  listWorkspaceFiles,
  listWorkspaceFolders,
  moveWorkspaceFile,
  renameWorkspaceFile,
  renameWorkspaceFolder,
  saveWorkspaceFileToDrive,
  uploadWorkspaceFile,
  workspaceFileSource,
} from '../../apis/workspaceApi';
import { formatSize } from '../DetailsPopup';
import FileViewer, { getPreviewKind } from '../FileViewer';
import { useNotifications } from '../../context/NotificationsContext';
import { useSearch } from '../../context/SearchContext';
import { Notice, dangerBtn, inputClass, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import DrivePickerModal from './DrivePickerModal';
import Modal from './Modal';
import { formatDateTime } from './workspaceUtils';

// Indents folders under their parents for the "Move to…" list.
function folderTree(all) {
  const kids = new Map();
  for (const f of all) {
    const k = String(f.parentId ?? 'root');
    kids.set(k, [...(kids.get(k) ?? []), f]);
  }
  const out = [];
  const walk = (parent, depth) => {
    for (const f of kids.get(parent) ?? []) {
      out.push({ ...f, depth });
      walk(String(f._id), depth + 1);
    }
  };
  walk('root', 0);
  return out;
}

const iconBtn = 'p-2 rounded-lg hover:bg-surface-hover hover:text-text cursor-pointer';

function FilesTab({ ws, readOnly, onExpired }) {
  const [params, setParams] = useSearchParams();
  const folderId = params.get('folder') || '';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploads, setUploads] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [dialog, setDialog] = useState(null); // {kind, item?}
  const [value, setValue] = useState('');
  const [allFolders, setAllFolders] = useState([]);
  const [moveTo, setMoveTo] = useState('');
  const inputRef = useRef(null);
  const source = useMemo(() => workspaceFileSource(ws._id), [ws._id]);
  const { refresh: refreshNotifications } = useNotifications();
  const { query, setEnabled, setQuery } = useSearch();
  const canWrite = !readOnly && (ws.role === 'owner' || ws.role === 'editor');

  // Top-bar search filters the folder you're looking at.
  useEffect(() => {
    setEnabled(true);
    return () => {
      setEnabled(false);
      setQuery('');
    };
  }, [setEnabled, setQuery]);

  const load = useCallback(async () => {
    try {
      setData(await listWorkspaceFiles(ws._id, folderId));
      setError('');
      // The server counts a file-list fetch as "seen"; sync the bell badge.
      refreshNotifications();
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      if (err.response?.status === 404 && folderId) {
        setParams({}, { replace: true }); // folder was deleted — back to the root
        return;
      }
      setError(err.response?.data?.error || 'Could not load files.');
      setData((p) => p ?? { folders: [], files: [], breadcrumb: [] });
    }
  }, [ws._id, folderId, onExpired, refreshNotifications, setParams]);

  useEffect(() => {
    setData(null);
    load();
    // Pick up files other members add while this page stays open.
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const fail = (err, fallback) => {
    if (err.response?.status === 410) return onExpired(err.response.data);
    setError(err.response?.data?.error || fallback);
  };

  async function handleFiles(list) {
    for (const file of Array.from(list)) {
      const id = `${Date.now()}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: file.name, progress: 0 }]);
      try {
        await uploadWorkspaceFile(
          ws._id,
          file,
          (e) => {
            const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress } : x)));
          },
          undefined,
          folderId,
        );
        setUploads((u) => u.filter((x) => x.id !== id));
        load();
      } catch (err) {
        if (err.response?.status === 410) return onExpired(err.response.data);
        const msg = err.response?.data?.error || 'Upload failed.';
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: msg } : x)));
      }
    }
  }

  const openDialog = async (kind, item) => {
    setValue(kind === 'rename-file' || kind === 'rename-folder' ? item.name : '');
    setMoveTo(folderId);
    setDialog({ kind, item });
    if (kind === 'move') {
      try {
        setAllFolders(folderTree(await listWorkspaceFolders(ws._id)));
      } catch {
        setAllFolders([]);
      }
    }
  };

  async function submitDialog(e) {
    e?.preventDefault();
    const { kind, item } = dialog;
    setDialog(null);
    try {
      if (kind === 'new-folder') await createWorkspaceFolder(ws._id, value, folderId);
      if (kind === 'rename-file') await renameWorkspaceFile(ws._id, item._id, value);
      if (kind === 'rename-folder') await renameWorkspaceFolder(ws._id, item._id, value);
      if (kind === 'move') await moveWorkspaceFile(ws._id, item._id, moveTo);
      if (kind === 'delete-file') await deleteWorkspaceFile(ws._id, item._id);
      if (kind === 'delete-folder') await deleteWorkspaceFolder(ws._id, item._id);
      load();
    } catch (err) {
      fail(err, 'Something went wrong.');
    }
  }

  async function saveToDrive(f) {
    setNotice('');
    try {
      await saveWorkspaceFileToDrive(ws._id, f._id);
      setNotice(`Saved “${f.name}” to My Drive.`);
    } catch (err) {
      fail(err, 'Could not save to My Drive.');
    }
  }

  const q = query.trim().toLowerCase();
  const folders = (data?.folders ?? []).filter((f) => !q || f.name.toLowerCase().includes(q));
  const files = (data?.files ?? []).filter((f) => !q || f.name.toLowerCase().includes(q));
  const pct = Math.min(100, Math.round((ws.size / ws.maxBytes) * 100));
  const goto = (id) => setParams(id ? { folder: id } : {});
  const open = (f) =>
    getPreviewKind(f.name) ? setViewer(f) : source.download(f._id).catch(() => setError('Could not download.'));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[160px]">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span className="inline-flex items-center gap-1.5"><FaHdd size={10} /> Workspace storage</span>
            <span>{formatSize(ws.size)} / {formatSize(ws.maxBytes)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <input ref={inputRef} type="file" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
            <button className={`${secondaryBtn} inline-flex items-center gap-2`} onClick={() => openDialog('new-folder')}>
              <FaFolderPlus size={12} /> New folder
            </button>
            <button className={`${secondaryBtn} inline-flex items-center gap-2`} onClick={() => setDialog({ kind: 'drive' })}>
              <FaCloudDownloadAlt size={12} /> From My Drive
            </button>
            <button className={`${primaryBtn} inline-flex items-center gap-2`} onClick={() => inputRef.current?.click()}>
              <FaUpload size={11} /> Upload
            </button>
          </div>
        )}
      </div>

      <nav className="flex flex-wrap items-center gap-1 text-sm text-text-muted" aria-label="Folder path">
        <button type="button" className={`hover:text-text cursor-pointer ${!folderId ? 'text-text font-semibold' : ''}`} onClick={() => goto('')}>
          Workspace
        </button>
        {(data?.breadcrumb ?? []).map((b, i, arr) => (
          <span key={b._id} className="inline-flex items-center gap-1">
            <FaChevronRight size={9} />
            <button type="button" className={`hover:text-text cursor-pointer ${i === arr.length - 1 ? 'text-text font-semibold' : ''}`} onClick={() => goto(b._id)}>
              {b.name}
            </button>
          </span>
        ))}
      </nav>

      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}

      {uploads.map((u) => (
        <div key={u.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="truncate text-text">{u.name}</span>
            {u.error ? (
              <button className="text-text-muted hover:text-text cursor-pointer" aria-label="Dismiss" onClick={() => setUploads((x) => x.filter((i) => i.id !== u.id))}><FaTimes /></button>
            ) : <span className="text-text-muted">{u.progress}%</span>}
          </div>
          {u.error ? <p className="text-danger mt-1">{u.error}</p> : (
            <div className="h-1 rounded-full bg-surface-muted mt-1.5 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${u.progress}%` }} /></div>
          )}
        </div>
      ))}

      {data === null ? (
        <div className="py-14 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>
      ) : folders.length + files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 px-6 text-center text-sm text-text-muted">
          {q ? `Nothing here matches “${query}”.` : `This ${folderId ? 'folder' : 'workspace'} is empty.${canWrite ? ' Upload files or create a folder.' : ''}`}
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">
          {folders.map((f) => (
            <li key={f._id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
              <button className="min-w-0 flex-1 flex items-center gap-3 text-left cursor-pointer" onClick={() => goto(f._id)}>
                <FaFolder className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-text truncate">{f.name}</span>
              </button>
              <div className="flex items-center gap-0.5 text-text-muted">
                {f.canRename && <button title="Rename" aria-label="Rename folder" className={iconBtn} onClick={() => openDialog('rename-folder', f)}><FaEdit size={13} /></button>}
                {f.canDelete && <button title="Delete" aria-label="Delete folder" className={`${iconBtn} hover:!text-danger`} onClick={() => openDialog('delete-folder', f)}><FaTrash size={13} /></button>}
              </div>
            </li>
          ))}
          {files.map((f) => (
            <li key={f._id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
              <button className="min-w-0 flex-1 flex items-center gap-3 text-left cursor-pointer" onClick={() => open(f)}>
                <FaRegFileAlt className="text-text-muted flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text truncate">{f.name}</span>
                  <span className="block text-xs text-text-muted truncate">
                    {formatSize(f.size)} · {f.uploadedBy?.name || 'Unknown'} · {formatDateTime(f.createdAt)}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-0.5 text-text-muted">
                <button title="Download" aria-label="Download" className={iconBtn} onClick={() => source.download(f._id).catch(() => setError('Could not download.'))}><FaDownload size={13} /></button>
                <button title="Save a copy to My Drive" aria-label="Save to My Drive" className={`${iconBtn} hidden sm:inline-flex`} onClick={() => saveToDrive(f)}><FaCloudDownloadAlt size={14} /></button>
                {f.canRename && <button title="Rename" aria-label="Rename" className={iconBtn} onClick={() => openDialog('rename-file', f)}><FaEdit size={13} /></button>}
                {f.canMove && <button title="Move" aria-label="Move" className={`${iconBtn} hidden sm:inline-flex`} onClick={() => openDialog('move', f)}><FaArrowsAlt size={13} /></button>}
                {f.canDelete && <button title="Delete" aria-label="Delete" className={`${iconBtn} hover:!text-danger`} onClick={() => openDialog('delete-file', f)}><FaTrash size={13} /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewer && <FileViewer fileId={viewer._id} name={viewer.name} source={source} onClose={() => setViewer(null)} />}

      {dialog?.kind === 'drive' && (
        <DrivePickerModal
          onImport={(f) => importDriveFile(ws._id, f.id, folderId)}
          onClose={(changed) => {
            setDialog(null);
            if (changed) load();
          }}
        />
      )}

      {['new-folder', 'rename-file', 'rename-folder'].includes(dialog?.kind) && (
        <Modal title={dialog.kind === 'new-folder' ? 'New folder' : 'Rename'} onClose={() => setDialog(null)}>
          <form onSubmit={submitDialog} className="flex flex-col gap-3">
            <input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} autoFocus required maxLength={dialog.kind === 'rename-file' ? 255 : 100} placeholder={dialog.kind === 'new-folder' ? 'Folder name' : ''} />
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryBtn} onClick={() => setDialog(null)}>Cancel</button>
              <button type="submit" className={primaryBtn}>{dialog.kind === 'new-folder' ? 'Create' : 'Rename'}</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.kind === 'move' && (
        <Modal title={`Move “${dialog.item.name}”`} onClose={() => setDialog(null)}>
          <div className="rounded-xl border border-border max-h-64 overflow-y-auto divide-y divide-border">
            {[{ _id: '', name: 'Workspace (top level)', depth: 0 }, ...allFolders].map((f) => (
              <label key={f._id || 'root'} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover cursor-pointer" style={{ paddingLeft: `${12 + f.depth * 16}px` }}>
                <input type="radio" name="dest" checked={moveTo === f._id} onChange={() => setMoveTo(f._id)} />
                <FaFolder className="text-primary flex-shrink-0" size={13} />
                <span className="text-sm text-text truncate">{f.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className={secondaryBtn} onClick={() => setDialog(null)}>Cancel</button>
            <button className={primaryBtn} disabled={moveTo === folderId} onClick={submitDialog}>Move here</button>
          </div>
        </Modal>
      )}

      {(dialog?.kind === 'delete-file' || dialog?.kind === 'delete-folder') && (
        <Modal title={dialog.kind === 'delete-file' ? 'Delete file' : 'Delete folder'} onClose={() => setDialog(null)}>
          <p className="text-sm">
            Permanently delete &ldquo;{dialog.item.name}&rdquo;
            {dialog.kind === 'delete-folder' ? ' and everything inside it' : ''}?
          </p>
          <p className="text-xs text-text-muted mt-1">This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className={secondaryBtn} onClick={() => setDialog(null)}>Cancel</button>
            <button className={dangerBtn} onClick={submitDialog}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default FilesTab;
