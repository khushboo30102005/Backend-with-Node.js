import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { FaHdd, FaShareAlt, FaTrash, FaSun, FaMoon } from 'react-icons/fa';
import { fetchUser } from '../apis/userApi';
import ProfileMenu from './ProfileMenu';

const navItems = [
  {
    to: '/',
    label: 'My Drive',
    icon: FaHdd,
    match: (p) => p === '/' || p.startsWith('/directory'),
  },
  {
    to: '/shared-with-me',
    label: 'Shared with me',
    icon: FaShareAlt,
    match: (p) => p.startsWith('/shared-with-me'),
  },
  {
    to: '/trash',
    label: 'Trash',
    icon: FaTrash,
    match: (p) => p.startsWith('/trash'),
  },
];

function Sidebar() {
  const location = useLocation();
  const [usedPercent, setUsedPercent] = useState(0);

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );

  useEffect(() => {
    async function loadStorage() {
      try {
        const data = await fetchUser();
        const total = data.maxStorageInBytes || 1;
        setUsedPercent(Math.min((data.usedStorageInBytes / total) * 100, 100));
      } catch (err) {
        // Non-critical — pages redirect to /login on real auth failures.
      }
    }
    loadStorage();

    // DirectoryView fires this after uploads / deletes / moves so the
    // storage ring never goes stale.
    window.addEventListener('storage-changed', loadStorage);
    return () => window.removeEventListener('storage-changed', loadStorage);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  const ringDeg = (usedPercent / 100) * 360;

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 m-4 mr-0 rounded-3xl bg-primary p-4 min-h-[calc(100vh-2rem)] sticky top-4">
      {/* Profile + account menu (dashboard, logout, logout all) */}
      <ProfileMenu />

      <p className="text-[11px] font-bold uppercase tracking-wide text-white/60 px-2 mb-2">
        Menu
      </p>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, match }) => {
          const isActive = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Compact storage ring */}
      <div className="mt-auto px-2 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `conic-gradient(white ${ringDeg}deg, rgba(255,255,255,0.25) ${ringDeg}deg)`,
            }}
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">
                {Math.round(usedPercent)}%
              </span>
            </div>
          </div>
          <p className="text-[11px] text-white/70">Storage used</p>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 transition-colors duration-150 w-full"
        >
          {theme === 'dark' ? <FaSun size={15} /> : <FaMoon size={15} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;