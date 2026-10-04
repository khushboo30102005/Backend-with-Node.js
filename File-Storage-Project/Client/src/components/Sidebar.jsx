import { Link } from 'react-router';
import ProfileMenu from './ProfileMenu';
import Brand from './Brand';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';

// Persistent sidebar from 768px up. Below that, Layout renders the same
// pieces inside a slide-in drawer.
function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[264px] flex-shrink-0 m-4 mr-0 rounded-3xl sidebar-surface border border-white/10 p-4 h-[calc(100vh-2rem)] overflow-y-auto sticky top-4 shadow-card">
      <Link
        to="/"
        aria-label="StorageApp home"
        className="px-2 py-3 mb-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Brand />
      </Link>

      <SidebarNav />

      <SidebarFooter />
    </aside>
  );
}

export default Sidebar;