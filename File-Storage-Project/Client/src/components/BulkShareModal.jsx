import { useEffect, useRef, useState } from 'react';
import { FaTimes, FaSearch, FaUserCircle } from 'react-icons/fa';
import { searchUsers } from '../apis/userApi';
import { shareFile } from '../apis/shareApi';

// Share several selected files with one person at once.
// Folders can't be shared (the share API is file-only), so the caller passes
// only files and tells the user how many folders were left out.
function BulkShareModal({ files, skippedFolders = 0, onClose, onDone }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState('viewer');
  const [sharing, setSharing] = useState(false);
  const [summary, setSummary] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function close() {
    if (summary && summary.shared > 0) onDone?.();
    onClose();
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchUsers(trimmed));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setHasSearched(true);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleShare() {
    if (!selectedUser || sharing) return;
    setSharing(true);
    const outcomes = await Promise.allSettled(
      files.map((f) => shareFile(f.id, selectedUser._id, permission)),
    );
    let shared = 0;
    let already = 0;
    let failed = 0;
    outcomes.forEach((o) => {
      if (o.status === 'fulfilled') shared += 1;
      else if (o.reason?.response?.status === 409) already += 1;
      else failed += 1;
    });
    setSummary({ shared, already, failed });
    setSharing(false);
  }

  const n = files.length;
  const selectClass = 'border border-border text-sm bg-surface text-text rounded-lg';

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4"
      onClick={close}
    >
      <div
        className="bg-surface rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-3">
          <h2 className="text-base font-bold text-text">
            Share {n} {n === 1 ? 'file' : 'files'}
          </h2>
          <button
            onClick={close}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1"
          >
            <FaTimes size={15} />
          </button>
        </div>

        <div className="px-6 pb-4 flex-1 overflow-y-auto">
          {skippedFolders > 0 && (
            <p className="text-xs text-text-muted mb-3">
              {skippedFolders} {skippedFolders === 1 ? 'folder is' : 'folders are'} not
              included — only files can be shared.
            </p>
          )}

          {summary ? (
            <div className="text-sm text-text">
              {summary.shared > 0 && (
                <p className="text-emerald-600 font-medium">
                  Shared {summary.shared} {summary.shared === 1 ? 'file' : 'files'} with{' '}
                  {selectedUser.name}.
                </p>
              )}
              {summary.already > 0 && (
                <p className="text-text-muted mt-1">
                  {summary.already} already shared with them.
                </p>
              )}
              {summary.failed > 0 && (
                <p className="text-danger mt-1">
                  {summary.failed} could not be shared.
                </p>
              )}
            </div>
          ) : selectedUser ? (
            <>
              <div className="flex items-center gap-2.5 mb-3 px-3 py-2 rounded-lg border border-primary bg-primary/10">
                <FaUserCircle className="text-gray-400 flex-shrink-0" size={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{selectedUser.name}</p>
                  <p className="text-xs text-text-muted truncate">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  title="Choose someone else"
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <FaTimes size={12} />
                </button>
              </div>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className={`w-full px-2.5 py-2 ${selectClass}`}
              >
                <option value="viewer">Viewer — can view &amp; download</option>
                <option value="editor">Editor — can also rename</option>
              </select>
            </>
          ) : (
            <div>
              <div className="relative">
                <FaSearch
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by email address..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-surface text-text focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
                />
              </div>
              {query.trim().length >= 3 && (
                <div className="mt-1.5 bg-surface border border-border rounded-lg max-h-[180px] overflow-y-auto">
                  {searching ? (
                    <p className="text-xs text-text-muted px-3 py-2.5">Searching...</p>
                  ) : results.length === 0 && hasSearched ? (
                    <p className="text-xs text-text-muted px-3 py-2.5">
                      No registered user found with that email.
                    </p>
                  ) : (
                    results.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => {
                          setSelectedUser(u);
                          setQuery('');
                          setResults([]);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                      >
                        <FaUserCircle className="text-gray-400 flex-shrink-0" size={20} />
                        <div className="min-w-0">
                          <p className="text-sm text-text truncate">{u.name}</p>
                          <p className="text-xs text-text-muted truncate">{u.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-colors"
          >
            {summary ? 'Done' : 'Cancel'}
          </button>
          {!summary && (
            <button
              onClick={handleShare}
              disabled={!selectedUser || sharing}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sharing ? 'Sharing...' : `Share ${n} ${n === 1 ? 'file' : 'files'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkShareModal;