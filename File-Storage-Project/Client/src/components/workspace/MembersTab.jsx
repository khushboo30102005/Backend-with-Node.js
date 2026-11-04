import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FaUserCircle } from 'react-icons/fa';
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  transferWorkspace,
  updateWorkspaceMember,
} from '../../apis/workspaceApi';
import { Notice, dangerBtn, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import MemberPicker from './MemberPicker';
import Modal from './Modal';
import { RoleBadge } from './workspaceUtils';

const linkBtn = 'text-xs px-2 py-1.5 rounded-md text-text-muted hover:bg-surface-hover cursor-pointer';

function MembersTab({ ws, readOnly, reload, onExpired }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null); // {kind:'remove'|'cancel'|'transfer'|'leave', member}
  const isOwner = ws.role === 'owner' && !readOnly;

  async function run(fn, after, success) {
    setError('');
    setNotice('');
    try {
      await fn();
      if (success) setNotice(success);
      after ? after() : reload();
    } catch (err) {
      if (err.response?.status === 410) return onExpired(err.response.data);
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  }

  const doConfirm = () => {
    const { kind, member } = confirm;
    setConfirm(null);
    if (kind === 'remove' || kind === 'cancel') run(() => removeWorkspaceMember(ws._id, member._id));
    if (kind === 'transfer') run(() => transferWorkspace(ws._id, member._id));
    if (kind === 'leave') run(() => removeWorkspaceMember(ws._id, member._id), () => navigate('/workspaces'));
  };

  const active = ws.members.filter((m) => m.status !== 'pending');
  const pending = ws.members.filter((m) => m.status === 'pending');

  const row = (m) => {
    const isPending = m.status === 'pending';
    return (
      <li key={m._id} className="flex flex-wrap items-center gap-3 px-3 sm:px-4 py-3">
        {m.picture ? <img src={m.picture} alt="" className="w-9 h-9 rounded-full object-cover" /> : <FaUserCircle size={36} className="text-text-muted" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text truncate">{m.name}{m._id === ws.me && ' (you)'}</p>
          <p className="text-xs text-text-muted truncate">{m.email}</p>
        </div>
        {isPending && (
          <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/12 text-amber-500 text-[11px] font-semibold">Invited</span>
        )}
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
            {!isPending && <button className={`${linkBtn} hover:text-text`} onClick={() => setConfirm({ kind: 'transfer', member: m })}>Make owner</button>}
            <button className={`${linkBtn} hover:text-danger`} onClick={() => setConfirm({ kind: isPending ? 'cancel' : 'remove', member: m })}>
              {isPending ? 'Cancel invite' : 'Remove'}
            </button>
          </div>
        )}
        {!isOwner && !readOnly && m._id === ws.me && m.role !== 'owner' && (
          <button className={`${linkBtn} hover:text-danger`} onClick={() => setConfirm({ kind: 'leave', member: m })}>Leave</button>
        )}
      </li>
    );
  };

  const texts = {
    transfer: (m) => `Make ${m.name} the owner? You will become an editor and lose owner controls.`,
    remove: (m) => `Remove ${m.name}? They lose access immediately. Files they uploaded stay in the workspace.`,
    cancel: (m) => `Cancel the invitation to ${m.name}?`,
    leave: () => 'You will lose access to this workspace.',
  };
  const titles = { transfer: 'Transfer ownership', remove: 'Remove member', cancel: 'Cancel invitation', leave: 'Leave workspace' };

  return (
    <div className="flex flex-col gap-4">
      {isOwner && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-sm font-semibold text-text mb-2">Invite someone</p>
          <MemberPicker
            excludeIds={ws.members.map((m) => m._id)}
            onPick={(u) => run(() => addWorkspaceMember(ws._id, u._id, 'editor'), undefined, `Invitation sent to ${u.name}.`)}
          />
          <p className="text-xs text-text-muted mt-2">
            They get a notification and join once they accept. Invited as an editor; change the role below.
          </p>
        </div>
      )}

      {error && <Notice>{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}

      <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">{active.map(row)}</ul>

      {pending.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted -mb-2">Pending invitations</p>
          <ul className="rounded-xl border border-border bg-surface divide-y divide-border shadow-card">{pending.map(row)}</ul>
        </>
      )}

      {confirm && (
        <Modal title={titles[confirm.kind]} onClose={() => setConfirm(null)}>
          <p className="text-sm">{texts[confirm.kind](confirm.member)}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button className={secondaryBtn} onClick={() => setConfirm(null)}>Cancel</button>
            <button className={confirm.kind === 'transfer' ? primaryBtn : dangerBtn} onClick={doConfirm}>Confirm</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default MembersTab;
