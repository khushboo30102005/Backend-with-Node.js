import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteWorkspace, updateWorkspace } from '../../apis/workspaceApi';
import { Notice, dangerBtn, inputClass, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import Modal from './Modal';
import { EXPIRY_PRESETS, toLocalInputValue } from './workspaceUtils';

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

export default SettingsTab;
