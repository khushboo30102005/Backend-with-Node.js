import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { FaSpinner } from 'react-icons/fa';
import LandingPage from './LandingPage';
import { fetchUser } from './apis/userApi';

// "/" is only the public entry point: guests see the landing page, signed-in
// users are sent to /mydrive (the real, bookmarkable My Drive route).
function RootRoute() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'authed' | 'guest'

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        await fetchUser();
        if (!cancelled) setStatus('authed');
      } catch (err) {
        // Any non-2xx (401 not logged in, 403 deleted account, etc.) — treat as guest
        if (!cancelled) setStatus('guest');
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbff]">
        <FaSpinner className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  return status === 'authed' ? (
    <Navigate to="/mydrive" replace />
  ) : (
    <LandingPage />
  );
}

export default RootRoute;