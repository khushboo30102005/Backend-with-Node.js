import { useEffect, useState } from 'react';
import { FaChevronRight, FaFolder, FaRegFileAlt, FaSpinner } from 'react-icons/fa';
import { getDirectoryItems } from '../../apis/directoryApi';
import { formatSize } from '../DetailsPopup';
import { Notice, primaryBtn, secondaryBtn } from '../../settings/SettingsUI';
import Modal from './Modal';

// Browse My Drive and pick files to copy into the workspace.
function DrivePickerModal({ onClose, onImport }) {
  const [dir, setDir] = useState(null); // { id, breadcrumb, directories, files }
  const [dirId, setDirId] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Map()); // id -> file
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    let cancelled = false;
    setDir(null);
    getDirectoryItems(dirId)
      .then((d) => !cancelled && setDir(d))
      .catch((e) => !cancelled && setError(e.response?.data?.error || 'Could not load My Drive.'));
    return () => {
      cancelled = true;
    };
  }, [dirId]);

  const toggle = (f) =>
    setSelected((prev) => {
      const next = new Map(prev);
      next.has(f.id) ? next.delete(f.id) : next.set(f.id, f);
      return next;
    });

  async function submit() {
    setBusy(true);
    setError('');
    const files = [...selected.values()];
    for (let i = 0; i < files.length; i++) {
      setProgress(`Adding ${i + 1} of ${files.length}…`);
      try {
        await onImport(files[i]);
      } catch (err) {
        setError(`${files[i].name}: ${err.response?.data?.error || 'could not be added.'}`);
        setBusy(false);
        setProgress('');
        return;
      }
    }
    onClose(true);
  }

  return (
    <Modal title="Add from My Drive" onClose={() => !busy && onClose(false)} wide>
      <p className="text-xs text-text-muted -mt-2 mb-3">A copy is added to the workspace; your original stays in My Drive.</p>

      {dir && (
        <nav className="flex flex-wrap items-center gap-1 text-xs text-text-muted mb-2" aria-label="Folder path">
          {dir.breadcrumb.map((b, i) => (
            <span key={b.id} className="inline-flex items-center gap-1">
              {i > 0 && <FaChevronRight size={8} />}
              <button type="button" className="hover:text-text cursor-pointer" onClick={() => setDirId(i === 0 ? '' : b.id)}>
                {b.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {error && <div className="mb-2"><Notice>{error}</Notice></div>}

      <div className="rounded-xl border border-border max-h-72 overflow-y-auto">
        {!dir ? (
          <div className="py-10 flex justify-center text-text-muted"><FaSpinner className="animate-spin" /></div>
        ) : dir.directories.length + dir.files.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">This folder is empty.</p>
        ) : (
          <ul className="divide-y divide-border">
            {dir.directories.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => setDirId(d.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover cursor-pointer">
                  <FaFolder className="text-primary flex-shrink-0" />
                  <span className="text-sm text-text truncate">{d.name}</span>
                </button>
              </li>
            ))}
            {dir.files.map((f) => (
              <li key={f.id}>
                <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" className="app-checkbox" checked={selected.has(f.id)} onChange={() => toggle(f)} />
                  <FaRegFileAlt className="text-text-muted flex-shrink-0" />
                  <span className="min-w-0 flex-1 text-sm text-text truncate">{f.name}</span>
                  <span className="text-xs text-text-muted flex-shrink-0">{formatSize(f.size)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <span className="text-xs text-text-muted">{progress || `${selected.size} selected`}</span>
        <div className="flex gap-2">
          <button className={secondaryBtn} disabled={busy} onClick={() => onClose(false)}>Cancel</button>
          <button className={primaryBtn} disabled={busy || selected.size === 0} onClick={submit}>
            {busy ? 'Adding…' : 'Add to workspace'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DrivePickerModal;
