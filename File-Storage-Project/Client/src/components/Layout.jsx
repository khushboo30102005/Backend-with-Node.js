import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { FaHdd, FaShareAlt, FaTrash, FaBars, FaTimes } from 'react-icons/fa';
import Sidebar from './Sidebar';

// Same matching rules as Sidebar so "My Drive" also highlights on /directory/:id
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

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[998] bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-[240px] h-full bg-primary flex flex-col p-4 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-3 mb-4">
              <span className="text-lg font-bold tracking-tight text-white">
                StorageApp
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/70"
                aria-label="Close menu"
              >
                <FaTimes size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map(({ to, label, icon: Icon, match }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    match(location.pathname)
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-600"
            aria-label="Open menu"
          >
            <FaBars size={16} />
          </button>
          <span className="text-sm font-bold text-text">StorageApp</span>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Layout;