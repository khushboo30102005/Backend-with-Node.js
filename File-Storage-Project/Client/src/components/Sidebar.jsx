import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  FaHdd,
  FaShareAlt,
  FaTrash,
  FaSignOutAlt,
  FaUser,
  FaSun,
  FaMoon,
} from 'react-icons/fa';
import { fetchUser, logoutUser } from '../apis/userApi';

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
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState(null);
  const [usedPercent, setUsedPercent] = useState(0);

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUser();
        setUserName(data.name);
        setUserPicture(data.picture);
        const total = data.maxStorageInBytes || 1;
        setUsedPercent(Math.min((data.usedStorageInBytes / total) * 100, 100));
      } catch (err) {
        // Sidebar shows a blank profile card if this fails — non-critical,
        // DirectoryHeader/pages still redirect to /login on real auth failures.
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }
  async function handleLogout() {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  const ringDeg = (usedPercent / 100) * 360;

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 m-4 mr-0 rounded-3xl bg-primary p-4 min-h-[calc(100vh-2rem)] sticky top-4">
      {/* Profile */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        {userPicture ? (
          <img
            src={userPicture}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
            <FaUser className="text-white" size={16} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {userName || 'Loading...'}
          </p>
          <p className="text-[11px] text-white/70">Storage</p>
        </div>
      </div>

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

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 mt-4 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 transition-colors duration-150 w-full"
        >
          <FaSignOutAlt size={15} />
          Exit the storage
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
