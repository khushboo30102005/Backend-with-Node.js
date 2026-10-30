import { useCallback, useEffect, useState } from 'react';
import { axiosWithCreds } from '../apis/axiosInstances';

export function useCookieCheck() {
  const [status, setStatus] = useState('checking'); // checking | ok | blocked

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      await axiosWithCreds.get('/auth/cookie-test');
      const { data } = await axiosWithCreds.get('/auth/cookie-test/verify');
      setStatus(data.enabled ? 'ok' : 'blocked');
    } catch {
      setStatus('ok'); // network trouble isn't a cookie problem; don't block the user
    }
  }, []);

  useEffect(() => { check(); }, [check]);
  return { status, recheck: check };
}