import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FaPlus, FaUsers, FaHdd, FaLock, FaHourglassHalf, FaSpinner, FaRegFileAlt } from 'react-icons/fa';
import {
  acceptInvitation,
  declineInvitation,
  listWorkspaces,
  searchWorkspaceFiles,
} from '../../apis/workspaceApi';
import { useNotifications } from '../../context/NotificationsContext';
import { useSearch } from '../../context/SearchContext';
import { useUser } from '../../context/UserContext';
import AdminWorkspaces from './AdminWorkspaces';
import { formatSize } from '../DetailsPopup';
import { Notice, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import {
  RoleBadge,
  StateBadge,
  formatDateTime,
  formatRemaining,
  liveState,
  useNow,
} from './workspaceUtils';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring soon' },
  { key: 'expired', label: 'Expired' },
];

const EMPTY = {
  active: 'No active workspaces. Create one to start sharing files for a limited time.',
  expiring: 'Nothing is about to expire in the next 24 hours.',
  expired: 'No expired workspaces.',
};

function WorkspaceCard({ ws, state, now }) {
  const expired = state === 'expired' || state === 'purged';
  const locked = expired && !(ws.canOpen && ws.status === 'expired');
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-text leading-snug break-words min-w-0">{ws.name}</h3>
        <StateBadge state={state} />
      </div>
      {ws.description && <p className="text-[13px] text-text-muted mt-1.5 line-clamp-2">{ws.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5"><FaUsers size={11} /> {ws.memberCount}</span>
        <span className="inline-flex items-center gap-1.5"><FaHdd size={11} /> {formatSize(ws.size)}</span>
        <RoleBadge role={ws.role} />
      </div>

      <div className="mt-3 pt-3 border-t border-border text-xs">
        {expired ? (
          <p className="text-text-muted flex items-center gap-1.5">
            <FaLock size={10} />
            {state === 'purged'
              ? 'Files were removed after expiry'
              : ws.canOpen
                ? 'Archived — read-only for you'
                : 'Access revoked'}
            <span className="ml-auto">{formatDateTime(ws.expiresAt)}</span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-text-muted">
            <FaHourglassHalf size={10} />
            <span className={state === 'expiring' ? 'text-amber-500 font-semibold' : ''}>
              {formatRemaining(new Date(ws.expiresAt).getTime() - now)}
            </span>
            <span className="ml-auto">Expires {formatDateTime(ws.expiresAt)}</span>
          </p>
        )}
      </div>
    </>
  );

  const cls = `block rounded-xl border border-border bg-surface p-4 shadow-card transition-all`;
  // Locked cards still link through so the user lands on the clear "expired" screen.
  return (
    <Link to={`/workspaces/${ws._id}`} className={`${cls} ${locked ? 'opacity-75' : 'hover:shadow-card-hover hover:border-border-strong'}`}>
      {body}
    </Link>
  );
}

function WorkspacesPage() {
  const navigate = useNavigate();
  const now = useNow(30000);
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');
  const [creating, setCreating] = useState(false);
  const [fileHits, setFileHits] = useState([]);
  const [inviteBusy, setInviteBusy] = useState(null);
  const { user } = useUser();
  const { notifications, refresh: refreshNotifications } = useNotifications();
  const { query, setEnabled, setQuery } = useSearch();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Owner';
  const invites = notifications.filter((n) => n.type === 'workspace-invite');

  // The top-bar search finds workspaces by name and files inside them.
  useEffect(() => {
    setEnabled(true);
    return () => {
      setEnabled(false);
      setQuery('');
    };
  }, [setEnabled, setQuery]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setFileHits([]);
      return undefined;
    }
    const t = setTimeout(() => {
      searchWorkspaceFiles(q).then(setFileHits).catch(() => setFileHits([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function respond(n, accept) {
    setInviteBusy(n.workspaceId);
    try {
      await (accept ? acceptInvitation(n.workspaceId) : declineInvitation(n.workspaceId));
      await Promise.all([refreshNotifications(), load()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not respond to the invitation.');
      refreshNotifications();
    } finally {
      setInviteBusy(null);
    }
  }

  const load = useCallback(async () => {
    try {
      setItems(await listWorkspaces());
      setError('');
    } catch (err) {
      if (err.response?.status === 401) return navigate('/login');
      setError(err.response?.data?.error || 'Could not load workspaces.');
      setItems((prev) => prev ?? []);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const g = { active: [], expiring: [], expired: [] };
    for (const ws of items || []) {
      const s = liveState(ws, now);
      g[s === 'purged' ? 'expired' : s].push({ ws, s });
    }
    return g;
  }, [items, now]);

  const q = query.trim().toLowerCase();
  const list = grouped[tab].filter(
    ({ ws }) => !q || ws.name.toLowerCase().includes(q) || (ws.description || '').toLowerCase().includes(q),
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Workspaces</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Temporary shared spaces that lock automatically when time runs out.
          </p>
        </div>
        <button className={`${primaryBtn} inline-flex items-center gap-2`} onClick={() => setCreating(true)}>
          <FaPlus size={11} /> New workspace
        </button>
      </div>

      {invites.length > 0 && (
        <section className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.06] p-4" aria-label="Invitations">
          <p className="text-sm font-semibold text-text mb-3">Pending invitations ({invites.length})</p>
          <ul className="flex flex-col gap-2">
            {invites.map((n) => (
              <li key={n.workspaceId} className="flex flex-wrap items-center gap-3 rounded-lg bg-surface border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-sm font-medium text-text truncate">{n.workspaceName}</p>
                  <p className="text-xs text-text-muted">
                    {n.addedBy.name} invited you as {n.role} · expires {formatDateTime(n.expiresAt)}
                  </p>
                </div>
                <button className={primaryBtn} disabled={inviteBusy === n.workspaceId} onClick={() => respond(n, true)}>Accept</button>
                <button className={secondaryBtn} disabled={inviteBusy === n.workspaceId} onClick={() => respond(n, false)}>Decline</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fileHits.length > 0 && (
        <section className="mt-5" aria-label="Matching files">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Files in your workspaces</p>
          <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">
            {fileHits.map((f) => (
              <li key={f._id}>
                <Link
                  to={`/workspaces/${f.workspaceId}${f.folderId ? `?folder=${f.folderId}` : ''}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover"
                >
                  <FaRegFileAlt className="text-text-muted flex-shrink-0" />
                  <span className="min-w-0 flex-1 text-sm text-text truncate">{f.name}</span>
                  <span className="text-xs text-text-muted truncate max-w-[40%]">{f.workspaceName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div role="tablist" className="mt-5 flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.key ? 'border-primary text-text' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {t.label}
            <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-surface-muted text-text-muted">
              {grouped[t.key].length}
            </span>
          </button>
        ))}
        {isAdmin && (
          <button
            role="tab"
            aria-selected={tab === 'admin'}
            onClick={() => setTab('admin')}
            className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ml-auto ${
              tab === 'admin' ? 'border-primary text-text' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Admin
          </button>
        )}
      </div>

      {error && <div className="mt-4"><Notice>{error}</Notice></div>}

      {tab === 'admin' ? (
        <div className="mt-5"><AdminWorkspaces /></div>
      ) : items === null ? (
        <div className="py-20 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border py-14 px-6 text-center text-sm text-text-muted">
          {q ? `No workspaces match “${query}”.` : EMPTY[tab]}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {list.map(({ ws, s }) => (
            <WorkspaceCard key={ws._id} ws={ws} state={s} now={now} />
          ))}
        </div>
      )}

      {creating && (
        <CreateWorkspaceModal
          onClose={() => setCreating(false)}
          onCreated={(id) => navigate(`/workspaces/${id}`)}
        />
      )}
    </div>
  );
}

export default WorkspacesPage;
