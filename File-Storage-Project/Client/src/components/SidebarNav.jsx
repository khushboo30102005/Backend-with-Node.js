import { Link, useLocation } from 'react-router';
import { FaHdd, FaShareAlt, FaTrash } from 'react-icons/fa';

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

function SidebarNav({ onNavigate }) {
  const location = useLocation();

  return (
    <>
      <p className="text-xs font-semibold tracking-wide text-white/50 px-3 mb-2">
        Menu
      </p>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, match }) => {
          const isActive = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3.5 min-h-12 px-3.5 rounded-xl text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                isActive
                  ? 'bg-white text-sidebar shadow-sm dark:bg-primary/25 dark:text-white dark:ring-1 dark:ring-primary/50 dark:shadow-none'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default SidebarNav;