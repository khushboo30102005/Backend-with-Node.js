import { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import LandingPage from './LandingPage';
import DirectoryView from './DirectoryView';
import { fetchUser } from './apis/userApi';
import Layout from './components/Layout';

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
    <Layout>
      <DirectoryView />
    </Layout>
  ) : (
    <LandingPage />
  );
}

export default RootRoute;
