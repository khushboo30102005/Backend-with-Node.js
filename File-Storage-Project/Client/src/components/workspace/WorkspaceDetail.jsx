import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FaArrowLeft, FaBan, FaHourglassHalf, FaLock, FaSpinner } from 'react-icons/fa';
import { getWorkspace, reactivateWorkspace } from '../../apis/workspaceApi';
import { Notice, inputClass, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import ActivityTab from './ActivityTab';
import FilesTab from './FilesTab';
import MembersTab from './MembersTab';
import Modal from './Modal';
import SettingsTab from './SettingsTab';
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

function ExpiredScreen({ info, message }) {
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
      {info?.expiresAt && <p className="mt-1 text-xs text-text-muted">Expired {formatDateTime(info.expiresAt)}</p>}
      <Link to="/workspaces" className={`${primaryBtn} inline-block mt-6`}>Back to workspaces</Link>
    </div>
  );
}

function ReactivateModal({ ws, onClose, onDone }) {
  const [when, setWhen] = useState(toLocalInputValue(Date.now() + 7 * 24 * 3600 * 1000));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await reactivateWorkspace(ws._id, new Date(when).toISOString());
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reactivate.');
      setBusy(false);
    }
  }

  return (
    <Modal title="Reactivate workspace" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-sm text-text-muted">Members get their access back and the files become editable again until the new expiry.</p>
        <input type="datetime-local" className={inputClass} value={when} onChange={(e) => setWhen(e.target.value)} required />
        <div className="flex flex-wrap gap-1.5">
          {EXPIRY_PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => setWhen(toLocalInputValue(Date.now() + p.ms))} className="px-2.5 py-1 rounded-full border border-border text-xs text-text-muted hover:text-text cursor-pointer">
              {p.label}
            </button>
          ))}
        </div>
        {error && <Notice>{error}</Notice>}
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={primaryBtn} disabled={busy}>{busy ? 'Reactivating…' : 'Reactivate'}</button>
        </div>
      </form>
    </Modal>
  );
}

function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const now = useNow(1000);
  const [ws, setWs] = useState(null);
  const [expired, setExpired] = useState(null); // {info, message}
  const [error, setError] = useState('');
  const [tab, setTab] = useState('files');
  const [reactivating, setReactivating] = useState(false);

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
  const activeCount = ws.members.filter((m) => m.status !== 'pending').length;
  const tabs = [
    { key: 'files', label: 'Files' },
    { key: 'members', label: `Members (${activeCount})` },
    { key: 'activity', label: 'Activity' },
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
        <div className="mt-4">
          <Notice kind="info">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span><FaLock className="inline mr-2" size={11} />Archived: this workspace has expired. Only you can view its files, read-only, until {ws.purgeAfter ? formatDateTime(ws.purgeAfter) : 'the retention period ends'}.</span>
              {ws.canReactivate && (
                <button className={primaryBtn} onClick={() => setReactivating(true)}>Reactivate</button>
              )}
            </span>
          </Notice>
        </div>
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
        {activeTab === 'activity' && <ActivityTab ws={ws} onExpired={onExpired} />}
        {activeTab === 'settings' && <SettingsTab key={ws.expiresAt + ws.name} ws={ws} reload={load} onExpired={onExpired} />}
      </div>

      {reactivating && (
        <ReactivateModal ws={ws} onClose={() => setReactivating(false)} onDone={() => { setReactivating(false); load(); }} />
      )}
    </div>
  );
}

export default WorkspaceDetail;
