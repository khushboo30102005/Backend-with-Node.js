import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { FaBars, FaRegBell, FaSearch, FaTimes } from 'react-icons/fa';
import { useSearch } from '../context/SearchContext';
import Brand from './Brand';
import ProfileMenu from './ProfileMenu';

function SearchField() {
  const { query, setQuery, enabled } = useSearch();
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative w-full">
      <FaSearch
        size={14}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
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
        className="w-full h-12 pl-11 pr-14 rounded-2xl border border-border bg-surface shadow-card text-base md:text-sm text-text placeholder:text-text-muted transition-[border-color,box-shadow] duration-150 hover:enabled:border-border-strong focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
        >
          <FaTimes size={12} />
        </button>
      ) : (
        enabled && (
          <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md border border-border bg-surface-muted text-[11px] font-semibold text-text-muted">
            {isMac ? '⌘ K' : 'Ctrl K'}
          </kbd>
        )
      )}
    </div>
  );
}

function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center justify-center w-11 h-11 rounded-full text-text-muted hover:bg-surface-hover hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
      >
        <FaRegBell size={17} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.25)] overflow-hidden animate-menu-pop">
          <p className="px-4 py-3 text-sm font-semibold text-text border-b border-border">
            Notifications
          </p>
          <div className="flex flex-col items-center text-center px-6 py-8">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
              <FaRegBell size={18} />
            </span>
            <p className="text-sm font-semibold text-text">No notifications yet</p>
            <p className="text-xs text-text-muted mt-1">
              Notifications will appear here once they&apos;re available.
            </p>
          </div>
        </div>
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
      <div className="sticky top-0 z-30 border-b border-border bg-page/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-1.5 px-2 sm:px-4 md:px-6 h-16">
          {/* < 768px: menu button + brand */}
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-text hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
          >
            <FaBars size={18} />
          </button>
          <Link
            to="/"
            aria-label="StorageApp home"
            className="md:hidden min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
          >
            <Brand onDark={false} />
          </Link>

          {/* ≥ 768px: wide search */}
          <div className="hidden md:block flex-1 max-w-[680px]">
            <SearchField />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
            <NotificationsButton />
            <ProfileMenu variant="topbar" />
          </div>
        </div>
      </div>

      {/* < 768px: full-width search row under the header */}
      <div className="md:hidden px-4 pt-3">
        <SearchField />
      </div>
    </>
  );
}

export default TopBar;