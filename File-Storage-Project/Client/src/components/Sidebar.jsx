import { Link } from 'react-router';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Brand from './Brand';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';

const toggleClass =
  'flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

// Full-height, flat sidebar (md and up). Below 768px Layout renders the same
// pieces inside a drawer.
function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 h-dvh sidebar-surface border-r border-white/10 transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[72px]' : 'w-[248px]'
      }`}
    >
      <div
        className={`flex items-center flex-shrink-0 h-16 ${
          collapsed ? 'justify-center' : 'justify-between pl-4 pr-3'
        }`}
      >
        <Link
          to="/mydrive"
          aria-label="StorageApp home"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Brand compact={collapsed} />
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            aria-expanded="true"
            className={toggleClass}
          >
            <FaChevronLeft size={12} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          aria-expanded="false"
          className={`${toggleClass} mx-auto mb-2`}
        >
          <FaChevronRight size={12} />
        </button>
      )}

      <div
        className={`flex-1 min-h-0 overflow-y-auto flex flex-col pb-3 ${
          collapsed ? 'px-3' : 'px-3.5'
        }`}
      >
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </div>
    </aside>
  );
}

export default Sidebar;