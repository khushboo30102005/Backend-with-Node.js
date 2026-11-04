import { useCallback, useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { adminListWorkspaces, adminRetryCleanup } from '../../apis/workspaceApi';
import { formatSize } from '../DetailsPopup';
import { Notice, secondaryBtn } from '../../settings/SettingsUI';
import { formatDateTime } from './workspaceUtils';

const STATUS_CLS = {
  active: 'text-success',
  expired: 'text-amber-500',
  purged: 'text-text-muted',
};

// Admin/Owner view: lifecycle and cleanup health of every workspace.
// Metadata only — admins cannot see file names or open files.
function AdminWorkspaces() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const [onlyProblems, setOnlyProblems] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await adminListWorkspaces());
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load workspaces.');
      setRows((p) => p ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function retry(id) {
    setBusy(id);
    setNotice('');
    try {
      const res = await adminRetryCleanup(id);
      setNotice(res.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Retry failed.');
    } finally {
      setBusy(null);
    }
  }

  if (rows === null) return <div className="py-14 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>;

  const shown = onlyProblems ? rows.filter((r) => r.cleanup.lastError) : rows;
  const problems = rows.filter((r) => r.cleanup.lastError).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-muted">{rows.length} workspaces · {problems} with cleanup errors</p>
        <label className="inline-flex items-center gap-2 text-[13px] text-text cursor-pointer">
          <input type="checkbox" className="app-checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
          Only failed cleanups
        </label>
      </div>
      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-text-muted">Nothing to show.</div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">
          {shown.map((r) => (
            <li key={r._id} className="px-4 py-3 flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-semibold text-text truncate">{r.name}</p>
                <p className="text-xs text-text-muted truncate">{r.owner?.name} · {r.owner?.email}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  <span className={`font-semibold capitalize ${STATUS_CLS[r.status]}`}>{r.status}</span>
                  {' · '}{r.cleanupPolicy} · {r.memberCount} members · {formatSize(r.size)}
                </p>
                <p className="text-xs text-text-muted">
                  Expires {formatDateTime(r.expiresAt)}
                  {r.purgeAfter && r.status === 'expired' ? ` · purge ${formatDateTime(r.purgeAfter)}` : ''}
                </p>
                {r.cleanup.lastError && (
                  <p className="text-xs text-danger mt-1 break-words">
                    Cleanup failed ({r.cleanup.attempts}×): {r.cleanup.lastError}
                  </p>
                )}
              </div>
              {r.status === 'expired' && (
                <button className={secondaryBtn} disabled={busy === r._id} onClick={() => retry(r._id)}>
                  {busy === r._id ? 'Retrying…' : 'Retry cleanup'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminWorkspaces;
