import { useCallback, useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { listWorkspaceActivity } from '../../apis/workspaceApi';
import { Notice, secondaryBtn } from '../../settings/SettingsUI';
import { formatDateTime } from './workspaceUtils';

const q = (s) => <strong className="font-semibold break-all">“{s}”</strong>;

// One sentence per audit-trail entry.
// The viewer's own actions read "You added…" instead of showing their name.
function describe(a, me) {
  const isMe = (u) => u && String(u._id) === String(me);
  const who = isMe(a.actor) ? 'You' : (a.actor?.name ?? 'The system');
  const target = isMe(a.target) ? 'you' : (a.target?.name ?? 'a member');
  const their = isMe(a.actor) ? 'your' : 'their';
  switch (a.type) {
    case 'workspace_created': return <>{who} created this workspace</>;
    case 'member_invited': return <>{who} invited {target} as {a.detail || 'a member'}</>;
    case 'invitation_accepted': return <>{who} joined the workspace</>;
    case 'invitation_declined': return <>{who} declined the invitation</>;
    case 'member_removed': return <>{who} removed {target}</>;
    case 'member_left': return <>{who} left the workspace</>;
    case 'member_role_changed': return <>{who} changed {target} to {a.detail}</>;
    case 'ownership_transferred': return <>{who} made {target} the owner</>;
    case 'owner_auto_transferred': return <>Ownership moved to {target} ({a.detail})</>;
    case 'file_uploaded': return <>{who} uploaded {q(a.targetName)}</>;
    case 'file_imported': return <>{who} added {q(a.targetName)} from My Drive</>;
    case 'file_saved_to_drive': return <>{who} saved {q(a.targetName)} to {their} My Drive</>;
    case 'file_renamed': return <>{who} renamed {q(a.detail)} to {q(a.targetName)}</>;
    case 'file_moved': return <>{who} moved {q(a.targetName)} to {a.detail}</>;
    case 'file_deleted': return <>{who} deleted {q(a.targetName)}</>;
    case 'folder_created': return <>{who} created the folder {q(a.targetName)}</>;
    case 'folder_renamed': return <>{who} renamed the folder {q(a.detail)} to {q(a.targetName)}</>;
    case 'folder_deleted': return <>{who} deleted the folder {q(a.targetName)}{a.detail ? ` (${a.detail})` : ''}</>;
    case 'settings_updated': return <>{who} updated the workspace settings</>;
    case 'expiry_changed': return <>{who} set the expiry to {formatDateTime(a.detail)}</>;
    case 'reactivated': return <>{who} reactivated the workspace until {formatDateTime(a.detail)}</>;
    case 'expired': return <>The workspace expired</>;
    default: return <>{who} did something ({a.type})</>;
  }
}

function ActivityTab({ ws, onExpired }) {
  const [items, setItems] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (before) => {
      try {
        const data = await listWorkspaceActivity(ws._id, before);
        setItems((prev) => (before ? [...(prev ?? []), ...data.items] : data.items));
        setHasMore(data.hasMore);
      } catch (err) {
        if (err.response?.status === 410) return onExpired(err.response.data);
        setError(err.response?.data?.error || 'Could not load activity.');
        setItems((p) => p ?? []);
      }
    },
    [ws._id, onExpired],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (items === null) return <div className="py-14 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-3">
      {error && <Notice>{error}</Notice>}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-text-muted">No activity yet.</div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">
          {items.map((a) => (
            <li key={a._id} className="px-4 py-3">
              <p className="text-sm text-text">{describe(a, ws.me)}</p>
              <p className="text-xs text-text-muted mt-0.5">{formatDateTime(a.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <button className={`${secondaryBtn} self-center`} onClick={() => load(items[items.length - 1].createdAt)}>
          Load older
        </button>
      )}
    </div>
  );
}

export default ActivityTab;
