import { useEffect, useRef, useState } from 'react';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import { searchUsers } from '../../apis/userApi';
import { inputClass } from '../../settings/SettingsUI';

// Debounced email search (same /users/search endpoint the Share dialog uses).
// Calls onPick(user) and clears itself; `excludeIds` hides people already added.
function MemberPicker({ excludeIds = [], onPick, placeholder = 'Search people by email…' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);
  const excluded = excludeIds.join(',');

  useEffect(() => {
    clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(q);
        const skip = new Set(excluded.split(',').filter(Boolean));
        setResults(data.filter((u) => !skip.has(String(u._id))));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, excluded]);

  return (
    <div className="relative">
      <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      <input
        type="text"
        className={`${inputClass} pl-8`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim().length >= 3 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-card-hover">
          {searching && <li className="px-3 py-2.5 text-xs text-text-muted">Searching…</li>}
          {!searching && results.length === 0 && (
            <li className="px-3 py-2.5 text-xs text-text-muted">No matching users</li>
          )}
          {results.map((u) => (
            <li key={u._id}>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-hover cursor-pointer"
                onClick={() => {
                  onPick(u);
                  setQuery('');
                  setResults([]);
                }}
              >
                {u.picture ? (
                  <img src={u.picture} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <FaUserCircle size={28} className="text-text-muted" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text truncate">{u.name}</span>
                  <span className="block text-xs text-text-muted truncate">{u.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MemberPicker;
