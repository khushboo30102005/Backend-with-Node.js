import { useEffect, useState } from 'react';
import {
  FaDatabase,
  FaMoon,
  FaSun,
  FaCog,
  FaArrowRight,
} from 'react-icons/fa';
import { fetchUser } from '../apis/userApi';
import { formatSize } from './DetailsPopup';

function SoonPill() {
  return (
    <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-white/60">
      Soon
    </span>
  );
}

// Storage card + dark-mode switch + settings. Data flow is unchanged:
// fetchUser() on mount and on `storage-changed`; theme saved in localStorage.
function SidebarFooter() {
  const [usage, setUsage] = useState({ used: 0, max: 0 });

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
        setUsage({
          used: data.usedStorageInBytes || 0,
          max: data.maxStorageInBytes || 0,
        });
      } catch (err) {
        // Non-critical — pages redirect to /login on real auth failures.
      }
    }
    loadStorage();

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

  const total = usage.max || 1;
  const usedPercent = Math.min((usage.used / total) * 100, 100);
  const ringDeg = (usedPercent / 100) * 360;
  const barWidth = usage.used > 0 ? Math.max(usedPercent, 2) : 0;
  const isDark = theme === 'dark';

  return (
    <div className="mt-auto pt-6">
      <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-4">
        <div className="flex items-center gap-2.5 text-white">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
            <FaDatabase size={13} />
          </span>
          <p className="text-sm font-semibold">Storage</p>
        </div>

        <div className="flex items-center gap-3.5 mt-4">
          <div
            className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 [--storage-ring:white] dark:[--storage-ring:var(--color-primary)]"
            style={{
              background: `conic-gradient(var(--storage-ring) ${ringDeg}deg, rgba(255,255,255,0.16) ${ringDeg}deg)`,
            }}
          >
            <div className="w-[2.6rem] h-[2.6rem] rounded-full bg-sidebar-deep flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {Math.round(usedPercent)}%
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {formatSize(usage.used)} of {formatSize(usage.max)}
            </p>
            <div
              className="mt-2.5 h-1.5 rounded-full bg-white/15 overflow-hidden"
              role="progressbar"
              aria-label="Storage used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(usedPercent)}
            >
              <div
                className="h-full rounded-full bg-white dark:bg-primary transition-[width] duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Prepared UI — plan management isn't built yet */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Storage management is coming soon"
          className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 cursor-not-allowed"
        >
          Manage storage <FaArrowRight size={10} />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className="flex items-center justify-between w-full min-h-12 px-3.5 rounded-xl text-[15px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <span className="flex items-center gap-3.5">
            {isDark ? <FaSun size={16} /> : <FaMoon size={16} />}
            Dark mode
          </span>
          <span
            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
              isDark ? 'bg-primary' : 'bg-white/25'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                isDark ? 'translate-x-4' : ''
              }`}
            />
          </span>
        </button>

        {/* Prepared UI — settings page isn't built yet */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Settings are coming soon"
          className="flex items-center gap-3.5 w-full min-h-12 px-3.5 rounded-xl text-[15px] font-medium text-white/45 cursor-not-allowed"
        >
          <FaCog size={16} />
          Settings
          <SoonPill />
        </button>
      </div>
    </div>
  );
}

export default SidebarFooter;