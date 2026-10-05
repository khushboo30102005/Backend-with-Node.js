import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { FaTimes } from 'react-icons/fa';
import { SearchProvider } from '../context/SearchContext';
import { UserProvider } from '../context/UserContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import Sidebar from './Sidebar';
import Brand from './Brand';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';
import TopBar from './TopBar';

// Mounted ONCE as a layout route. Pages render through <Outlet />, so the
// sidebar, top bar and user data survive navigation; only the page changes.
function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === '1',
  );
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // New page => start at the top of the scroll area (folder → folder too)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    setMobileOpen(false);
  }, [pathname]);

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
      <div className="flex h-dvh overflow-hidden bg-page">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />

        {mobileOpen && (
          <div
            className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-[2px] md:hidden animate-backdrop"
            onClick={closeDrawer}
          >
            <aside
              className="w-[300px] max-w-[88vw] h-dvh sidebar-surface border-r border-white/10 flex flex-col overflow-y-auto animate-slide-in px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between px-1 py-1.5 mb-3">
                <Brand />
                <button
                  onClick={closeDrawer}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label="Close menu"
                >
                  <FaTimes size={16} />
                </button>
              </div>
              <SidebarNav onNavigate={closeDrawer} />
              <SidebarFooter />
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar onOpenMenu={() => setMobileOpen(true)} />
          <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}

function Layout() {
  return (
    <UserProvider>
      <NotificationsProvider>
        <Shell />
      </NotificationsProvider>
    </UserProvider>
  );
}

export default Layout;