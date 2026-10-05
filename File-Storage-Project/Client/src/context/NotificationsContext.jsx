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
  markNotificationsSeen,
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
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Non-critical — keep whatever we had; auth failures are handled by the shell.
    }
  }, []);

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
    () => ({ notifications, unreadCount, refresh, markSeen }),
    [notifications, unreadCount, refresh, markSeen],
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
    }
  );
}