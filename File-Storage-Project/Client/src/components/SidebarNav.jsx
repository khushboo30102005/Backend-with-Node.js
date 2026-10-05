import { Link, useLocation } from 'react-router';
import { FaHome, FaUserFriends, FaTrash } from 'react-icons/fa';

const navItems = [
  {
    to: '/mydrive',
    label: 'My Drive',
    icon: FaHome,
    match: (p) => p.startsWith('/mydrive'),
  },
  {
    to: '/shared',
    label: 'Shared with me',
    icon: FaUserFriends,
    match: (p) => p.startsWith('/shared'),
  },
  {
    to: '/trash',
    label: 'Trash',
    icon: FaTrash,
    match: (p) => p.startsWith('/trash'),
  },
];

function SidebarNav({ onNavigate, collapsed = false }) {
  const location = useLocation();

  return (
    <>
      {collapsed ? (
        <div className="h-px bg-white/10 mx-2 mb-3" />
      ) : (
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-white/45">
          Menu
        </p>
      )}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, match }) => {
          const isActive = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                collapsed
                  ? 'justify-center w-11 h-11 mx-auto'
                  : 'gap-3.5 h-10 px-3'
              } ${
                isActive
                  ? 'bg-[#1d4fb8] text-white shadow-sm dark:bg-primary/25 dark:ring-1 dark:ring-primary/45 dark:shadow-none'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-white/10" />
    </>
  );
}

export default SidebarNav;