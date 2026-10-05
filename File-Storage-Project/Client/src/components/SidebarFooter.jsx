import { useEffect, useState } from 'react';
import {
  FaDatabase,
  FaMoon,
  FaSun,
  FaCog,
  FaArrowRight,
} from 'react-icons/fa';
import { useUser } from '../context/UserContext';
import { formatSize } from './DetailsPopup';

function Ring({ deg, label, size, text }) {
  return (
    <div
      className={`relative ${size} rounded-full flex-shrink-0 [--storage-ring:#5b8cff]`}
      style={{
        background: `conic-gradient(var(--storage-ring) ${deg}deg, rgba(255,255,255,0.12) 0deg)`,
      }}
    >
      <div className="absolute inset-[5px] rounded-full bg-sidebar-deep flex items-center justify-center">
        <span className={`${text} font-bold text-white`}>{label}</span>
      </div>
    </div>
  );
}

// Storage card + dark-mode switch + settings, pinned to the bottom.
// Storage numbers come from the shared user (refreshed on `storage-changed`).
function SidebarFooter({ collapsed = false }) {
  const { user } = useUser();
  const used = user?.usedStorageInBytes || 0;
  const max = user?.maxStorageInBytes || 0;

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'),
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isDark = theme === 'dark';
  const usedPercent = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const percentLabel =
    used > 0 && usedPercent < 1 ? '<1%' : `${Math.round(usedPercent)}%`;
  const ringDeg = used > 0 ? Math.max((usedPercent / 100) * 360, 8) : 0;
  const barWidth = used > 0 ? Math.max(usedPercent, 2) : 0;

  const rowClass =
    'flex items-center rounded-lg text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

  if (collapsed) {
    return (
      <div className="mt-auto pt-4 flex flex-col items-center gap-1">
        <div title={`${formatSize(used)} of ${formatSize(max)} used`}>
          <Ring deg={ringDeg} label={percentLabel} size="w-11 h-11" text="text-[10px]" />
        </div>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title="Dark mode"
          aria-label="Toggle dark mode"
          className={`${rowClass} justify-center w-11 h-11 mt-2`}
        >
          {isDark ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>
        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          className={`${rowClass} justify-center w-11 h-11`}
        >
          <FaCog size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-auto pt-4">
      <div className="rounded-2xl bg-sidebar-deep border border-white/10 p-3.5 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/10 text-white">
            <FaDatabase size={13} />
          </span>
          <p className="text-sm font-semibold text-white">Storage</p>
        </div>

        <div className="flex items-center gap-3 mt-3.5">
          <Ring deg={ringDeg} label={percentLabel} size="w-14 h-14" text="text-[13px]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-white/85 truncate">
              {formatSize(used)} of {formatSize(max)}
            </p>
            <div
              className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden"
              role="progressbar"
              aria-label="Storage used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(usedPercent)}
            >
              <div
                className="h-full rounded-full bg-[#5b8cff] transition-[width] duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <button
              type="button"
              className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#7da2ff] hover:text-[#a3bdff] transition-colors"
            >
              Manage storage <FaArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className={`${rowClass} justify-between w-full h-10 px-3`}
        >
          <span className="flex items-center gap-3.5">
            {isDark ? <FaSun size={15} /> : <FaMoon size={15} />}
            Dark mode
          </span>
          <span
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              isDark ? 'bg-primary' : 'bg-white/25'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                isDark ? 'translate-x-4' : ''
              }`}
            />
          </span>
        </button>

        <button type="button" className={`${rowClass} gap-3.5 w-full h-10 px-3`}>
          <FaCog size={15} />
          Settings
        </button>
      </div>
    </div>
  );
}

export default SidebarFooter;