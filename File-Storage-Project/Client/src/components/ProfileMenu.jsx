import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FaSignOutAlt,
  FaLaptop,
  FaUserShield,
  FaUserTie,
  FaChevronDown,
  FaKey,
} from 'react-icons/fa';
import SetPasswordModal from './SetPasswordModal';
import { logoutUser, logoutAllSessions } from '../apis/userApi';
import { useUser } from '../context/UserContext';

const DASHBOARD_ROLES = ['Owner', 'Admin', 'Manager'];

function Avatar({ user, className }) {
  return user?.picture ? (
    <img
      src={user.picture}
      alt={user.name}
      className={`${className} rounded-full object-cover flex-shrink-0`}
    />
  ) : (
    <span
      className={`${className} rounded-full flex items-center justify-center flex-shrink-0 bg-linear-to-br from-primary to-violet-500 text-white font-bold`}
    >
      {user?.name?.[0]?.toUpperCase() || '·'}
    </span>
  );
}

// variant="sidebar": profile card on the navy drawer (phones)
// variant="topbar":  compact avatar chip in the top bar
function ProfileMenu({ onNavigate, variant = 'sidebar' }) {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [showSetPassword, setShowSetPassword] = useState(false);

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
    'flex items-center gap-3 w-full min-h-10 px-4 py-2 text-sm text-text text-left cursor-pointer hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:bg-surface-muted';

  const isTopbar = variant === 'topbar';

  return (
    <div className={`relative ${isTopbar ? '' : 'mb-4'}`} ref={menuRef}>
      {isTopbar ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="flex items-center gap-2.5 h-10 pl-1 pr-1 sm:pr-3 rounded-full hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
        >
          <Avatar user={user} className="w-8 h-8 text-sm" />
          <span className="hidden sm:block text-[13.5px] font-semibold text-text max-w-[160px] truncate">
            {user?.name || ''}
          </span>
          <FaChevronDown
            size={10}
            className={`hidden sm:block text-text-muted transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-white/[0.07] ring-1 ring-white/10 hover:bg-white/[0.12] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <Avatar
            user={user}
            className="w-10 h-10 text-base ring-2 ring-white/20"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || ''}
            </p>
            <p className="text-xs text-white/60 truncate">
              {role || 'Account'}
            </p>
          </div>
          <FaChevronDown
            size={11}
            className={`text-white/70 flex-shrink-0 transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 bg-surface border border-border rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.25)] overflow-hidden animate-menu-pop ${
            isTopbar
              ? 'right-0 top-full w-64 max-w-[calc(100vw-1.5rem)]'
              : 'left-0 right-0 top-full'
          }`}
        >
          {user && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-text truncate">
                {user.name}
              </p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
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
          {user && user.hasPassword === false && (
            <button
              type="button"
              role="menuitem"
              className={rowClass}
              onClick={() => {
                setOpen(false);
                setShowSetPassword(true);
              }}
            >
              <FaKey size={14} className="text-primary" />
              Set password
            </button>
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
            <FaLaptop size={14} className="text-primary" />
            Logout all devices
          </button>
        </div>
      )}

      {showSetPassword && (
        <SetPasswordModal
          onClose={() => setShowSetPassword(false)}
          onSuccess={refreshUser}
        />
      )}
    </div>
  );
}

export default ProfileMenu;
