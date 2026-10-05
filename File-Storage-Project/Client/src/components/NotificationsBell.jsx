import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { FaRegBell } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationsContext';

function formatWhen(iso) {
  const date = new Date(iso);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SenderAvatar({ user }) {
  return user?.picture ? (
    <img
      src={user.picture}
      alt=""
      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-linear-to-br from-primary to-violet-500 text-white text-sm font-bold">
      {user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

function NotificationsBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Opening the bell does NOT mark anything read — visiting /shared does.
  function goToShared() {
    setOpen(false);
    navigate('/shared');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex items-center justify-center w-10 h-10 rounded-full text-text-muted hover:bg-surface-hover hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
      >
        <FaRegBell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-[17px] text-center ring-2 ring-page">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.25)] overflow-hidden animate-menu-pop">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-8">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                <FaRegBell size={18} />
              </span>
              <p className="text-sm font-semibold text-text">
                No notifications yet
              </p>
              <p className="text-xs text-text-muted mt-1">
                When someone shares a file with you, it will show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(26rem,65vh)] overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.shareId}>
                  <button
                    type="button"
                    onClick={goToShared}
                    className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:bg-surface-muted ${
                      n.seen ? '' : 'bg-primary/[0.06]'
                    }`}
                  >
                    <SenderAvatar user={n.sharedBy} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-text leading-snug">
                        <span className="font-semibold">{n.sharedBy.name}</span>{' '}
                        shared{' '}
                        <span className="font-semibold break-all">
                          “{n.file.name}”
                        </span>{' '}
                        with you
                        <span className="text-text-muted">
                          {' '}
                          · {n.permission === 'editor' ? 'Editor' : 'Viewer'}
                        </span>
                      </p>
                      <p
                        className="text-xs text-text-muted mt-0.5"
                        title={new Date(n.createdAt).toLocaleString()}
                      >
                        {formatWhen(n.createdAt)}
                      </p>
                    </div>
                    {!n.seen && (
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={goToShared}
            className="w-full px-4 py-2.5 text-[13px] font-semibold text-primary text-center border-t border-border hover:bg-surface-muted transition-colors"
          >
            Go to Shared with me
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;