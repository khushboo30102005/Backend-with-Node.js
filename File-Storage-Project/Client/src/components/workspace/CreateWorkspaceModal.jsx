import { useEffect, useState } from 'react';
import { FaTimes, FaTrashAlt, FaArchive } from 'react-icons/fa';
import { createWorkspace } from '../../apis/workspaceApi';
import { Notice, inputClass, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import MemberPicker from './MemberPicker';
import { EXPIRY_PRESETS, toLocalInputValue } from './workspaceUtils';

const POLICIES = [
  {
    value: 'delete',
    icon: FaTrashAlt,
    title: 'Delete files',
    badge: 'Recommended',
    text: 'Everything is permanently removed shortly after expiry.',
  },
  {
    value: 'archive',
    icon: FaArchive,
    title: 'Archive (read-only)',
    text: 'Only you can view the files for 30 days, then they are deleted.',
  },
];

function CreateWorkspaceModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState(() =>
    toLocalInputValue(Date.now() + 7 * 24 * 3600 * 1000),
  );
  const [policy, setPolicy] = useState('delete');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    const when = new Date(expiresAt);
    if (Number.isNaN(when.getTime())) return setError('Please choose an expiry date and time.');
    setSaving(true);
    try {
      const res = await createWorkspace({
        name,
        description,
        expiresAt: when.toISOString(),
        cleanupPolicy: policy,
        members: members.map((m) => ({ userId: m._id, role: m.role })),
      });
      onCreated(res._id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the workspace.');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface text-text w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] animate-sheet-up"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold">Create temporary workspace</h2>
            <p className="text-[13px] text-text-muted mt-0.5">
              Share files with chosen people until the expiry time, then access is revoked automatically.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -mr-2 rounded-lg text-text-muted hover:bg-surface-hover cursor-pointer">
            <FaTimes size={14} />
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Workspace name
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Phoenix review" maxLength={100} autoFocus required />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Description <span className="text-text-muted font-normal -mt-1">(optional)</span>
            <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What is this workspace for?" />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Expires on</span>
            <input type="datetime-local" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
            <div className="flex flex-wrap gap-1.5">
              {EXPIRY_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => setExpiresAt(toLocalInputValue(Date.now() + p.ms))} className="px-2.5 py-1 rounded-full border border-border text-xs text-text-muted hover:text-text hover:border-border-strong cursor-pointer">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">When it expires</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POLICIES.map(({ value, icon: Icon, title, badge, text }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPolicy(value)}
                  aria-pressed={policy === value}
                  className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                    policy === value ? 'border-primary bg-primary/10' : 'border-border hover:border-border-strong'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon size={13} /> {title}
                    {badge && <span className="ml-auto text-[10px] text-success font-semibold">{badge}</span>}
                  </span>
                  <span className="block text-xs text-text-muted mt-1">{text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Members</span>
            <MemberPicker
              excludeIds={members.map((m) => m._id)}
              onPick={(u) => setMembers((list) => [...list, { ...u, role: 'editor' }])}
            />
            {members.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {members.map((m) => (
                  <li key={m._id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{m.name}</span>
                      <span className="block text-xs text-text-muted truncate">{m.email}</span>
                    </span>
                    <select
                      value={m.role}
                      onChange={(e) => setMembers((list) => list.map((x) => (x._id === m._id ? { ...x, role: e.target.value } : x)))}
                      className="text-xs rounded-md border border-border bg-surface px-2 py-1.5"
                      aria-label={`Role for ${m.name}`}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button type="button" onClick={() => setMembers((list) => list.filter((x) => x._id !== m._id))} aria-label={`Remove ${m.name}`} className="p-1.5 rounded text-text-muted hover:text-danger cursor-pointer">
                      <FaTimes size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-text-muted">Editors can upload and manage files; viewers can only view and download. You can change this later.</p>
          </div>

          {error && <Notice>{error}</Notice>}

          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" className={secondaryBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={primaryBtn} disabled={saving}>
              {saving ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateWorkspaceModal;
