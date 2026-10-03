import { useEffect, useRef, useState } from 'react';
import { FaTimes, FaSearch, FaUserCircle } from 'react-icons/fa';
import { searchUsers, fetchUser } from '../apis/userApi';
import {
  shareFile,
  getFileShares,
  updateSharePermission,
  removeShare,
} from '../apis/shareApi';

function ShareModal({ file, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPermission, setNewPermission] = useState('viewer');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sharing, setSharing] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    loadShares();
    loadCurrentUserEmail();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadCurrentUserEmail() {
    try {
      const data = await fetchUser();
      setCurrentUserEmail((data.email || '').toLowerCase());
    } catch (err) {
      // Non-critical — worst case, the self-search just shows the
      // generic "no match" message instead of the friendlier one.
    }
  }

  async function loadShares() {
    setLoadingShares(true);
    try {
      const data = await getFileShares(file.id);
      setShares(data);
    } catch (err) {
      setError('Could not load people with access.');
    } finally {
      setLoadingShares(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(trimmed);
        const alreadySharedIds = new Set(shares.map((s) => s.user._id));
        setResults(data.filter((u) => !alreadySharedIds.has(u._id)));
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
        setHasSearched(true);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, shares]);

  function selectUser(user) {
    setSelectedUser(user);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError('');
  }

  async function handleShare() {
    if (!selectedUser) return;
    setError('');
    setSuccessMessage('');
    setSharing(true);
    try {
      await shareFile(file.id, selectedUser._id, newPermission);
      setSuccessMessage(`Shared with ${selectedUser.name}.`);
      setSelectedUser(null);
      setNewPermission('viewer');
      await loadShares();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not share this file.');
    } finally {
      setSharing(false);
    }
  }

  async function handlePermissionChange(share, permission) {
    setError('');
    try {
      await updateSharePermission(share.shareId, permission);
      setShares((prev) =>
        prev.map((s) =>
          s.shareId === share.shareId ? { ...s, permission } : s,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update permission.');
    }
  }

  async function handleRemove(share) {
    setError('');
    try {
      await removeShare(share.shareId);
      setShares((prev) => prev.filter((s) => s.shareId !== share.shareId));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove access.');
    }
  }

  const isSearchingOwnEmail =
    currentUserEmail && query.trim().toLowerCase() === currentUserEmail;

  const selectClass =
    'border border-border text-sm bg-surface text-text rounded-lg';

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
          <div className="min-w-0">
            <h2
              className="text-base font-bold text-text truncate"
              title={file.name}
            >
              Share "{file.name}"
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1 flex-shrink-0"
          >
            <FaTimes size={15} />
          </button>
        </div>

        <div className="px-6 flex-1 overflow-y-auto">
          {/* Add people */}
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
            Add people
          </p>

          {selectedUser ? (
            <>
              <div className="flex items-center gap-2.5 mb-3 px-3 py-2 rounded-lg border border-primary bg-primary/10">
                <FaUserCircle
                  className="text-gray-400 flex-shrink-0"
                  size={22}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  title="Choose someone else"
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <FaTimes size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <select
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value)}
                  className={`flex-1 px-2.5 py-2 ${selectClass}`}
                >
                  <option value="viewer">Viewer — can view & download</option>
                  <option value="editor">Editor — can also rename</option>
                </select>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {sharing ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </>
          ) : (
            <div className="mb-2">
              <div className="relative">
                <FaSearch
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by email address..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-surface text-text focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
                />
              </div>

              {query.trim().length >= 3 && (
                <div className="mt-1.5 bg-surface border border-border rounded-lg max-h-[180px] overflow-y-auto">
                  {searching ? (
                    <p className="text-xs text-text-muted px-3 py-2.5">
                      Searching...
                    </p>
                  ) : results.length === 0 && hasSearched ? (
                    <div className="px-3 py-2.5">
                      {isSearchingOwnEmail ? (
                        <p className="text-xs text-text-muted">
                          That's your own account — you can't share a file with
                          yourself.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-text-muted">
                            No registered user found with that email.
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            You can only share with people who already have an
                            account.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    results.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => selectUser(user)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                      >
                        <FaUserCircle
                          className="text-gray-400 flex-shrink-0"
                          size={20}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-text truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <p className="text-xs text-emerald-600 font-medium mb-3">
              {successMessage}
            </p>
          )}
          {error && <p className="text-xs text-danger mb-3">{error}</p>}

          {/* People with access */}
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mt-4 mb-2">
            People with access
          </p>
          <div className="flex flex-col gap-1 mb-4">
            {loadingShares ? (
              <p className="text-xs text-text-muted py-2">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                Not shared with anyone yet.
              </p>
            ) : (
              shares.map((share) => (
                <div
                  key={share.shareId}
                  className="flex items-center gap-2.5 py-2"
                >
                  <FaUserCircle
                    className="text-gray-400 flex-shrink-0"
                    size={22}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">
                      {share.user.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {share.user.email}
                    </p>
                  </div>
                  <select
                    value={share.permission}
                    onChange={(e) =>
                      handlePermissionChange(share, e.target.value)
                    }
                    className={`px-2 py-1.5 text-xs flex-shrink-0 ${selectClass} rounded-md`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={() => handleRemove(share)}
                    className="text-xs font-semibold text-danger hover:underline flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;