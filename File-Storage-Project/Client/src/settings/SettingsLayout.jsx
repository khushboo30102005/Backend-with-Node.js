import { Link, Outlet, useLocation } from 'react-router';
import {
  FaUser,
  FaShieldAlt,
  FaDatabase,
  FaRegBell,
  FaSlidersH,
} from 'react-icons/fa';

const items = [
  { to: '/settings/profile', label: 'Profile', icon: FaUser },
  { to: '/settings/security', label: 'Security', icon: FaShieldAlt },
  { to: '/settings/storage', label: 'Storage', icon: FaDatabase },
  { to: '/settings/notifications', label: 'Notifications', icon: FaRegBell },
  { to: '/settings/preferences', label: 'Preferences', icon: FaSlidersH },
];

function SettingsLayout() {
  const { pathname } = useLocation();

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-7 pt-4 pb-10 font-sans text-text">
      <header className="pb-4">
        <h1 className="text-[22px] font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-[13px] text-text-muted">
          Manage your account, security, storage, notifications, and
          preferences.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Phones/tablets: scrolling tab strip. ≥ md: vertical list. */}
        <nav
          aria-label="Settings"
          className="md:w-52 md:flex-shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto md:overflow-visible border-b border-border md:border-0"
        >
          <ul className="flex md:flex-col gap-1 pb-2 md:pb-0 w-max md:w-auto">
            {items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-muted hover:bg-surface-hover hover:text-text'
                    }`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SettingsLayout;