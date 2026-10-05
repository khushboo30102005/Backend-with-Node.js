import { useEffect } from 'react';
import { Link } from 'react-router';
import { FaBars, FaSearch, FaTimes } from 'react-icons/fa';
import { useSearch } from '../context/SearchContext';
import Brand from './Brand';
import ProfileMenu from './ProfileMenu';
import NotificationsBell from './NotificationsBell';

function SearchField() {
  const { query, setQuery, enabled } = useSearch();
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative w-full">
      <FaSearch
        size={13}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        data-global-search
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={!enabled}
        placeholder="Search files and folders..."
        aria-label="Search files and folders"
        title={enabled ? undefined : 'Search is available in My Drive'}
        className="w-full h-10 pl-10 pr-14 rounded-xl border border-border bg-surface text-base md:text-[13.5px] text-text placeholder:text-text-muted transition-[border-color,box-shadow] duration-150 hover:enabled:border-border-strong focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
        >
          <FaTimes size={11} />
        </button>
      ) : (
        enabled && (
          <kbd className="hidden md:block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md border border-border bg-surface-muted text-[11px] font-semibold text-text-muted">
            {isMac ? '⌘ K' : 'Ctrl K'}
          </kbd>
        )
      )}
    </div>
  );
}

function TopBar({ onOpenMenu }) {
  const { enabled } = useSearch();

  // Ctrl/Cmd + K focuses whichever search field is currently visible
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && enabled) {
        const inputs = document.querySelectorAll('[data-global-search]');
        const visible = Array.from(inputs).find((el) => el.offsetParent !== null);
        if (visible) {
          e.preventDefault();
          visible.focus();
          visible.select();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled]);

  return (
    <>
      <div className="flex-shrink-0 border-b border-border bg-page pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-1.5 px-2 sm:px-4 md:px-7 h-16">
          {/* < 768px: menu button + brand */}
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-text hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
          >
            <FaBars size={17} />
          </button>
          <Link
            to="/mydrive"
            aria-label="StorageApp home"
            className="md:hidden min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
          >
            <Brand onDark={false} />
          </Link>

          {/* ≥ 768px: wide search */}
          <div className="hidden md:block flex-1 max-w-[640px]">
            <SearchField />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
            <NotificationsBell />
            <ProfileMenu variant="topbar" />
          </div>
        </div>
      </div>

      {/* < 768px: full-width search row under the header */}
      <div className="md:hidden flex-shrink-0 px-4 pt-3">
        <SearchField />
      </div>
    </>
  );
}

export default TopBar;