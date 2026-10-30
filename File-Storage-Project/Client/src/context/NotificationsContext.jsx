import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getNotifications,
  getWorkspaceNotifications,
  markNotificationsSeen,
  markWorkspaceNotificationsSeen,
} from '../apis/notificationApi';

// Source of truth is the server (Share.seenAt). This only caches it for the
// bell and keeps it fresh: on mount, every 30s while the tab is visible, and
// when the tab regains focus. That's how a share made by someone else shows
// up without a page refresh.
const POLL_MS = 30000;

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    // File shares and workspace invitations are separate sources; one failing
    // must not hide the other.
    const [shares, spaces] = await Promise.allSettled([
      getNotifications(),
      getWorkspaceNotifications(),
    ]);
    if (shares.status === 'rejected' && spaces.status === 'rejected') {
      return; // Non-critical — keep what we had; auth failures are handled by the shell.
    }
    const s = shares.status === 'fulfilled' ? shares.value : null;
    const w = spaces.status === 'fulfilled' ? spaces.value : null;
    const merged = [
      ...(s ? s.notifications.map((n) => ({ ...n, type: 'share' })) : []),
      ...(w ? w.notifications : []),
    ].sort((a, b) => Number(a.seen) - Number(b.seen) || new Date(b.createdAt) - new Date(a.createdAt));
    setNotifications(merged);
    setUnreadCount((s?.unreadCount ?? 0) + (w?.unreadCount ?? 0));
  }, []);

  const markWorkspaceSeen = useCallback(
    async (workspaceIds) => {
      if (!workspaceIds || workspaceIds.length === 0) return;
      try {
        await markWorkspaceNotificationsSeen(workspaceIds);
      } catch {
        // Stays unread and retries on the next visit.
      }
      await refresh();
    },
    [refresh],
  );

  // Mark the given shares as seen on the server, then re-sync.
  const markSeen = useCallback(
    async (shareIds) => {
      if (!shareIds || shareIds.length === 0) return;
      try {
        await markNotificationsSeen(shareIds);
      } catch {
        // If this fails the notification simply stays unread and retries next visit.
      }
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
    const tick = () => {
      if (!document.hidden) refresh();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ notifications, unreadCount, refresh, markSeen, markWorkspaceSeen }),
    [notifications, unreadCount, refresh, markSeen, markWorkspaceSeen],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  return (
    useContext(NotificationsContext) || {
      notifications: [],
      unreadCount: 0,
      refresh: () => {},
      markSeen: () => {},
      markWorkspaceSeen: () => {},
    }
  );
}