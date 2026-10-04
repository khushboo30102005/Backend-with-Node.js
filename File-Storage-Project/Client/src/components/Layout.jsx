import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { SearchProvider } from '../context/SearchContext';
import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';
import Brand from './Brand';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';
import TopBar from './TopBar';

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Drawer: lock page scroll behind it, close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const closeDrawer = () => setMobileOpen(false);

  return (
    <SearchProvider>
      <div className="flex min-h-dvh bg-page">
        <Sidebar />

        {mobileOpen && (
          <div
            className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-[2px] md:hidden animate-backdrop"
            onClick={closeDrawer}
          >
            <aside
              className="w-[320px] max-w-[88vw] h-dvh sidebar-surface border-r border-white/10 flex flex-col overflow-y-auto animate-slide-in px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between px-1 py-2 mb-3">
                <Brand />
                <button
                  onClick={closeDrawer}
                  className="flex items-center justify-center w-11 h-11 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label="Close menu"
                >
                  <FaTimes size={17} />
                </button>
              </div>

              {/* Profile + account menu (dashboard, logout, logout all) */}
              <ProfileMenu onNavigate={closeDrawer} />

              <SidebarNav onNavigate={closeDrawer} />

              <SidebarFooter />
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <TopBar onOpenMenu={() => setMobileOpen(true)} />
          {children}
        </div>
      </div>
    </SearchProvider>
  );
}

export default Layout;