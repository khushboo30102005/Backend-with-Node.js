import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FaUser,
  FaSignOutAlt,
  FaUserShield,
  FaUserTie,
  FaChevronDown,
} from 'react-icons/fa';
import { fetchUser, logoutUser, logoutAllSessions } from '../apis/userApi';

const DASHBOARD_ROLES = ['Owner', 'Admin', 'Manager'];

function ProfileMenu({ onNavigate }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setUser(await fetchUser());
      } catch (err) {
        // Non-critical — pages redirect to /login on real auth failures.
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const role = user?.role;
  const hasDashboard = DASHBOARD_ROLES.includes(role);
  const DashboardIcon = role === 'Manager' ? FaUserTie : FaUserShield;

  function goTo(path) {
    setOpen(false);
    onNavigate?.();
    navigate(path);
  }

  async function handleLogout() {
    try {
      await logoutUser();
      goTo('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  async function handleLogoutAll() {
    try {
      await logoutAllSessions();
      goTo('/login');
    } catch (err) {
      console.error('Logout all error:', err);
    }
  }

  const rowClass =
    'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text text-left cursor-pointer hover:bg-surface-hover transition-colors';

  return (
    <div className="relative mb-4" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 w-full px-2 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
      >
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
            <FaUser className="text-white" size={16} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {user?.name || 'Loading...'}
          </p>
          <p className="text-[11px] text-white/70">{role || 'Account'}</p>
        </div>
        <FaChevronDown
          size={11}
          className={`text-white/70 flex-shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-surface border border-border rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden animate-menu-pop"
        >
          {user && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-text truncate">
                {user.name}
              </p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                {user.role}
              </span>
            </div>
          )}

          {hasDashboard && (
            <>
              <button
                type="button"
                role="menuitem"
                className={rowClass}
                onClick={() => goTo('/users')}
              >
                <DashboardIcon size={15} className="text-primary" />
                {role} Dashboard
              </button>
              <div className="border-t border-border" />
            </>
          )}

          <button
            type="button"
            role="menuitem"
            className={rowClass}
            onClick={handleLogout}
          >
            <FaSignOutAlt size={14} className="text-primary" />
            Logout
          </button>
          <button
            type="button"
            role="menuitem"
            className={rowClass}
            onClick={handleLogoutAll}
          >
            <FaSignOutAlt size={14} className="text-primary" />
            Logout all devices
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;