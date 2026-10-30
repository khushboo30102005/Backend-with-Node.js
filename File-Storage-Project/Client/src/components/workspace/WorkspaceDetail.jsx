import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  FaArrowLeft,
  FaBan,
  FaDownload,
  FaEdit,
  FaHourglassHalf,
  FaLock,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUpload,
  FaUserCircle,
} from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationsContext';
import {
  addWorkspaceMember,
  deleteWorkspace,
  deleteWorkspaceFile,
  getWorkspace,
  listWorkspaceFiles,
  removeWorkspaceMember,
  renameWorkspaceFile,
  transferWorkspace,
  updateWorkspace,
  updateWorkspaceMember,
  uploadWorkspaceFile,
  workspaceFileSource,
} from '../../apis/workspaceApi';
import { formatSize } from '../DetailsPopup';
import FileViewer, { getPreviewKind } from '../FileViewer';
import MemberPicker from './MemberPicker';
import {
  Notice,
  dangerBtn,
  inputClass,
  primaryBtn,
  secondaryBtn,
} from '../../settings/SettingsUI';
import {
  EXPIRY_PRESETS,
  RoleBadge,
  StateBadge,
  formatDateTime,
  formatRemaining,
  liveState,
  toLocalInputValue,
  useNow,
} from './workspaceUtils';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4" onClick={onClose}>
      <div className="bg-surface text-text w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] animate-sheet-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ExpiredScreen({ info, message }) {
  const archived = info?.status === 'expired' && info?.cleanupPolicy === 'archive';
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-danger/12 text-danger flex items-center justify-center mb-4">
        <FaBan size={22} />
      </div>
      <h1 className="text-xl font-bold text-text">This workspace has expired</h1>
      {info?.name && <p className="mt-1 text-sm font-medium text-text">{info.name}</p>}
      <p className="mt-2 text-sm text-text-muted">
        {message || 'Access was revoked automatically when the workspace reached its expiry time.'}
      </p>
      {info?.expiresAt && (
        <p className="mt-1 text-xs text-text-muted">Expired {formatDateTime(info.expiresAt)}</p>
      )}
      {archived && (
        <p className="mt-3 text-xs text-text-muted">Only the owner can still view the archived copy.</p>
      )}
      <Link to="/workspaces" className={`${primaryBtn} inline-block mt-6`}>Back to workspaces</Link>
    </div>
  );
}

// ------------------------------------------------------------------ Files tab
function FilesTab({ ws, readOnly, onExpired }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState([]); // {id,name,progress,error}
  const [viewer, setViewer] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState(null);
  const inputRef = useRef(null);
  const source = useMemo(() => workspaceFileSource(ws._id), [ws._id]);
  const canUpload = !readOnly && (ws.role === 'owner' || ws.role === 'editor');

  const load = useCallback(async () => {
    try {
      setFiles(await listWorkspaceFiles(ws._id));
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      setError(err.response?.data?.error || 'Could not load files.');
      setFiles((p) => p ?? []);
    }
  }, [ws._id, onExpired]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(list) {
    for (const file of Array.from(list)) {
      const id = `${Date.now()}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: file.name, progress: 0 }]);
      try {
        await uploadWorkspaceFile(ws._id, file, (e) => {
          const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress } : x)));
        });
        setUploads((u) => u.filter((x) => x.id !== id));
        load();
      } catch (err) {
        if (err.response?.status === 410) return onExpired(err.response.data);
        const msg = err.response?.data?.error || 'Upload failed.';
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: msg } : x)));
      }
    }
  }

  async function submitRename(e) {
    e.preventDefault();
    try {
      await renameWorkspaceFile(ws._id, renaming._id, renameValue);
      setRenaming(null);
      load();
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      setError(err.response?.data?.error || 'Could not rename.');
      setRenaming(null);
    }
  }

  async function confirmDelete() {
    const f = deleting;
    setDeleting(null);
    try {
      await deleteWorkspaceFile(ws._id, f._id);
      load();
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      setError(err.response?.data?.error || 'Could not delete.');
    }
  }

  const open = (f) =>
    getPreviewKind(f.name) ? setViewer(f) : source.download(f._id).catch(() => setError('Could not download.'));

  const pct = Math.min(100, Math.round((ws.size / ws.maxBytes) * 100));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[160px]">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Workspace storage</span>
            <span>{formatSize(ws.size)} / {formatSize(ws.maxBytes)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {canUpload && (
          <>
            <input ref={inputRef} type="file" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
            <button className={`${primaryBtn} inline-flex items-center gap-2`} onClick={() => inputRef.current?.click()}>
              <FaUpload size={11} /> Upload files
            </button>
          </>
        )}
      </div>

      {error && <Notice>{error}</Notice>}

      {uploads.map((u) => (
        <div key={u.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="truncate text-text">{u.name}</span>
            {u.error ? (
              <button className="text-text-muted hover:text-text cursor-pointer" onClick={() => setUploads((x) => x.filter((i) => i.id !== u.id))}><FaTimes /></button>
            ) : <span className="text-text-muted">{u.progress}%</span>}
          </div>
          {u.error ? <p className="text-danger mt-1">{u.error}</p> : (
            <div className="h-1 rounded-full bg-surface-muted mt-1.5 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${u.progress}%` }} /></div>
          )}
        </div>
      ))}

      {files === null ? (
        <div className="py-14 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 px-6 text-center text-sm text-text-muted">
          No files yet.{canUpload ? ' Upload something to share it with the workspace.' : ''}
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">
          {files.map((f) => (
            <li key={f._id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
              <button className="min-w-0 flex-1 text-left cursor-pointer" onClick={() => open(f)}>
                <span className="block text-sm font-medium text-text truncate">{f.name}</span>
                <span className="block text-xs text-text-muted truncate">
                  {formatSize(f.size)} · {f.uploadedBy?.name || 'Unknown'} · {formatDateTime(f.createdAt)}
                </span>
              </button>
              <div className="flex items-center gap-0.5 text-text-muted">
                <button title="Download" aria-label="Download" className="p-2 rounded-lg hover:bg-surface-hover hover:text-text cursor-pointer" onClick={() => source.download(f._id).catch(() => setError('Could not download.'))}><FaDownload size={13} /></button>
                {f.canRename && <button title="Rename" aria-label="Rename" className="p-2 rounded-lg hover:bg-surface-hover hover:text-text cursor-pointer" onClick={() => { setRenaming(f); setRenameValue(f.name); }}><FaEdit size={13} /></button>}
                {f.canDelete && <button title="Delete" aria-label="Delete" className="p-2 rounded-lg hover:bg-surface-hover hover:text-danger cursor-pointer" onClick={() => setDeleting(f)}><FaTrash size={13} /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewer && <FileViewer fileId={viewer._id} name={viewer.name} source={source} onClose={() => setViewer(null)} />}

      {renaming && (
        <Modal title="Rename file" onClose={() => setRenaming(null)}>
          <form onSubmit={submitRename} className="flex flex-col gap-3">
            <input className={inputClass} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus required maxLength={255} />
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryBtn} onClick={() => setRenaming(null)}>Cancel</button>
              <button type="submit" className={primaryBtn}>Rename</button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete file" onClose={() => setDeleting(null)}>
          <p className="text-sm">Permanently delete &ldquo;{deleting.name}&rdquo; from this workspace?</p>
          <p className="text-xs text-text-muted mt-1">This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className={secondaryBtn} onClick={() => setDeleting(null)}>Cancel</button>
            <button className={dangerBtn} onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Members tab
function MembersTab({ ws, readOnly, reload, onExpired }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null); // {kind:'remove'|'transfer'|'leave', member}
  const isOwner = ws.role === 'owner' && !readOnly;

  async function run(fn, after) {
    setError('');
    try {
      await fn();
      after ? after() : reload();
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  const doConfirm = () => {
    const { kind, member } = confirm;
    setConfirm(null);
    if (kind === 'remove') run(() => removeWorkspaceMember(ws._id, member._id));
    if (kind === 'transfer') run(() => transferWorkspace(ws._id, member._id));
    if (kind === 'leave') run(() => removeWorkspaceMember(ws._id, member._id), () => navigate('/workspaces'));
  };

  return (
    <div className="flex flex-col gap-4">
      {isOwner && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-sm font-semibold text-text mb-2">Add a member</p>
          <MemberPicker
            excludeIds={ws.members.map((m) => m._id)}
            onPick={(u) => run(() => addWorkspaceMember(ws._id, u._id, 'editor'))}
          />
          <p className="text-xs text-text-muted mt-2">They join as an editor; change the role below.</p>
        </div>
      )}

      {error && <Notice>{error}</Notice>}

      <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">
        {ws.members.map((m) => {
          return (
            <li key={m._id} className="flex flex-wrap items-center gap-3 px-3 sm:px-4 py-3">
              {m.picture ? <img src={m.picture} alt="" className="w-9 h-9 rounded-full object-cover" /> : <FaUserCircle size={36} className="text-text-muted" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">{m.name}{m._id === ws.me && ' (you)'}</p>
                <p className="text-xs text-text-muted truncate">{m.email}</p>
              </div>
              {m.role === 'owner' || !isOwner ? (
                <RoleBadge role={m.role} />
              ) : (
                <select
                  value={m.role}
                  onChange={(e) => run(() => updateWorkspaceMember(ws._id, m._id, e.target.value))}
                  className="text-xs rounded-md border border-border bg-surface px-2 py-1.5"
                  aria-label={`Role for ${m.name}`}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              )}
              {isOwner && m.role !== 'owner' && (
                <div className="flex gap-1">
                  <button className="text-xs px-2 py-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-text cursor-pointer" onClick={() => setConfirm({ kind: 'transfer', member: m })}>Make owner</button>
                  <button className="text-xs px-2 py-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-danger cursor-pointer" onClick={() => setConfirm({ kind: 'remove', member: m })}>Remove</button>
                </div>
              )}
              {!isOwner && !readOnly && m._id === ws.me && m.role !== 'owner' && (
                <button className="text-xs px-2 py-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-danger cursor-pointer" onClick={() => setConfirm({ kind: 'leave', member: m })}>Leave</button>
              )}
            </li>
          );
        })}
      </ul>

      {confirm && (
        <Modal
          title={confirm.kind === 'transfer' ? 'Transfer ownership' : confirm.kind === 'leave' ? 'Leave workspace' : 'Remove member'}
          onClose={() => setConfirm(null)}
        >
          <p className="text-sm">
            {confirm.kind === 'transfer' && `Make ${confirm.member.name} the owner? You will become an editor and lose owner controls.`}
            {confirm.kind === 'remove' && `Remove ${confirm.member.name}? They lose access immediately. Files they uploaded stay in the workspace.`}
            {confirm.kind === 'leave' && 'You will lose access to this workspace.'}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button className={secondaryBtn} onClick={() => setConfirm(null)}>Cancel</button>
            <button className={confirm.kind === 'transfer' ? primaryBtn : dangerBtn} onClick={doConfirm}>Confirm</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --------------------------------------------------------------- Settings tab
function SettingsTab({ ws, reload, onExpired }) {
  const navigate = useNavigate();
  const [name, setName] = useState(ws.name);
  const [description, setDescription] = useState(ws.description || '');
  const [expiresAt, setExpiresAt] = useState(toLocalInputValue(ws.expiresAt));
  const [policy, setPolicy] = useState(ws.cleanupPolicy);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    const when = new Date(expiresAt);
    if (Number.isNaN(when.getTime())) return setMsg({ kind: 'error', text: 'Choose a valid expiry.' });
    setSaving(true);
    try {
      await updateWorkspace(ws._id, { name, description, expiresAt: when.toISOString(), cleanupPolicy: policy });
      setMsg({ kind: 'success', text: 'Workspace updated.' });
      reload();
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      setMsg({ kind: 'error', text: err.response?.data?.error || 'Could not save.' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await deleteWorkspace(ws._id);
      navigate('/workspaces');
    } catch (err) {
      setConfirmDelete(false);
      setMsg({ kind: 'error', text: err.response?.data?.error || 'Could not delete.' });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={save} className="rounded-xl border border-border bg-surface p-4 shadow-card flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">Name
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">Description
          <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Expires on</span>
          <input type="datetime-local" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
          <div className="flex flex-wrap gap-1.5">
            {EXPIRY_PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setExpiresAt(toLocalInputValue(Date.now() + p.ms))} className="px-2.5 py-1 rounded-full border border-border text-xs text-text-muted hover:text-text cursor-pointer">
                {p.label} from now
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">After expiry
          <select className={inputClass} value={policy} onChange={(e) => setPolicy(e.target.value)}>
            <option value="delete">Delete files</option>
            <option value="archive">Archive for 30 days (owner, read-only)</option>
          </select>
        </label>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        <div className="flex justify-end"><button className={primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>

      <div className="rounded-xl border border-danger/30 bg-surface p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Delete workspace now</p>
          <p className="text-xs text-text-muted">Permanently removes all files and revokes access for everyone.</p>
        </div>
        <button className={dangerBtn} onClick={() => setConfirmDelete(true)}>Delete workspace</button>
      </div>

      {confirmDelete && (
        <Modal title="Delete workspace" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm">Delete &ldquo;{ws.name}&rdquo; and all of its files for everyone?</p>
          <p className="text-xs text-text-muted mt-1">This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className={secondaryBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className={dangerBtn} onClick={remove}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------- page
function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const now = useNow(1000);
  const [ws, setWs] = useState(null);
  const [expired, setExpired] = useState(null); // {workspace, error}
  const [error, setError] = useState('');
  const [tab, setTab] = useState('files');
  const { notifications, markWorkspaceSeen } = useNotifications();

  // Opening the workspace counts as seeing the "you were added" notification.
  const hasUnread = notifications.some(
    (n) => n.type === 'workspace' && n.workspaceId === id && !n.seen,
  );
  useEffect(() => {
    if (ws && hasUnread) markWorkspaceSeen([id]);
  }, [ws, hasUnread, id, markWorkspaceSeen]);

  const load = useCallback(async () => {
    try {
      const data = await getWorkspace(id);
      setWs(data);
      setExpired(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) return navigate('/login');
      if (status === 410) {
        setExpired({ info: err.response.data.workspace, message: err.response.data.error });
        return;
      }
      setError(status === 404 ? 'Workspace not found, or you no longer have access.' : err.response?.data?.error || 'Could not load workspace.');
    }
  }, [id, navigate]);

  useEffect(() => {
    setWs(null);
    setExpired(null);
    setError('');
    load();
  }, [load]);

  const onExpired = useCallback((data) => {
    setExpired({ info: data?.workspace, message: data?.error });
  }, []);

  // Expiry while the page is open: the moment the clock passes expiresAt,
  // re-check with the server, which then answers 410 and the screen switches.
  const due = ws && ws.status === 'active' && new Date(ws.expiresAt).getTime() <= now;
  useEffect(() => {
    if (due) load();
  }, [due, load]);

  if (expired) return <ExpiredScreen info={expired.info} message={expired.message} />;
  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-text-muted">{error}</p>
        <Link to="/workspaces" className={`${primaryBtn} inline-block mt-5`}>Back to workspaces</Link>
      </div>
    );
  }
  if (!ws) return <div className="py-24 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>;

  const state = liveState(ws, now);
  const readOnly = ws.readOnly;
  const remaining = new Date(ws.expiresAt).getTime() - now;
  const tabs = [
    { key: 'files', label: 'Files' },
    { key: 'members', label: `Members (${ws.members.length})` },
    ...(ws.role === 'owner' && !readOnly ? [{ key: 'settings', label: 'Settings' }] : []),
  ];
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'files';

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7">
      <Link to="/workspaces" className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-text mb-3">
        <FaArrowLeft size={10} /> All workspaces
      </Link>

      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-text break-words min-w-0">{ws.name}</h1>
          <StateBadge state={state} />
          <span className="px-2 py-0.5 rounded-full border border-border text-[11px] font-semibold text-text-muted">Temporary workspace</span>
          <RoleBadge role={ws.role} />
        </div>
        {ws.description && <p className="mt-1.5 text-sm text-text-muted">{ws.description}</p>}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5"><FaHourglassHalf size={10} /> Expires on {formatDateTime(ws.expiresAt)}</span>
          {!readOnly && <span className={state === 'expiring' ? 'text-amber-500 font-semibold' : ''}>{formatRemaining(remaining)}</span>}
          <span>Owner: {ws.owner?.name}</span>
        </p>
      </div>

      {readOnly && (
        <div className="mt-4"><Notice kind="info"><FaLock className="inline mr-2" size={11} />Archived: this workspace has expired. Only you can view its files, read-only, until {ws.purgeAfter ? formatDateTime(ws.purgeAfter) : 'the retention period ends'}.</Notice></div>
      )}
      {!readOnly && state === 'expiring' && (
        <div className="mt-4"><Notice kind="info">This workspace expires soon. Everyone loses access at the expiry time{ws.cleanupPolicy === 'delete' ? ' and files are deleted' : ''}.{ws.role === 'owner' ? ' You can extend it in Settings.' : ''}</Notice></div>
      )}

      <div role="tablist" className="mt-5 flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={activeTab === t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === t.key ? 'border-primary text-text' : 'border-transparent text-text-muted hover:text-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === 'files' && <FilesTab ws={ws} readOnly={readOnly} onExpired={onExpired} />}
        {activeTab === 'members' && <MembersTab ws={ws} readOnly={readOnly} reload={load} onExpired={onExpired} />}
        {activeTab === 'settings' && <SettingsTab key={ws.expiresAt + ws.name} ws={ws} reload={load} onExpired={onExpired} />}
      </div>
    </div>
  );
}

export default WorkspaceDetail;
