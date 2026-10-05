import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate } from 'react-router';
import { FaSpinner } from 'react-icons/fa';
import { fetchUser } from '../apis/userApi';

// One auth check + one copy of the current user for the whole signed-in
// app shell. Sidebar, top bar, profile menu and My Drive all read from here
// instead of each fetching /user on every mount (which is what made every
// route change look like a reload).
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | authed | guest | error
  // Folder listings, so returning to a folder paints instantly and is then
  // revalidated. Lives here so it is dropped when the shell unmounts (logout).
  const dirCache = useRef(new Map());

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetchUser();
      setUser(data);
      setStatus('authed');
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) setStatus('guest');
      else setStatus((prev) => (prev === 'checking' ? 'error' : prev));
    }
  }, []);

  useEffect(() => {
    refreshUser();
    window.addEventListener('storage-changed', refreshUser);
    return () => window.removeEventListener('storage-changed', refreshUser);
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, refreshUser, dirCache: dirCache.current }),
    [user, refreshUser],
  );

  if (status === 'checking') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-page">
        <FaSpinner className="animate-spin text-primary" size={26} />
      </div>
    );
  }
  if (status === 'guest') return <Navigate to="/login" replace />;

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  return useContext(UserContext) || { user: null, refreshUser: () => {}, dirCache: new Map() };
}