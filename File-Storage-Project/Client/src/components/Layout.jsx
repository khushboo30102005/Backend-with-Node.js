import { useState } from 'react';
import { NavLink } from 'react-router';
import { FaHdd, FaShareAlt, FaTrash, FaBars, FaTimes } from 'react-icons/fa';
import Sidebar from './Sidebar';

const navItems = [
  { to: '/', label: 'My Drive', icon: FaHdd, end: true },
  { to: '/shared-with-me', label: 'Shared with me', icon: FaShareAlt },
  { to: '/trash', label: 'Trash', icon: FaTrash },
];

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <div className="flex items-center justify-between px-5 py-6">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                StorageApp
              </span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400">
                <FaTimes size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-primary' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
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