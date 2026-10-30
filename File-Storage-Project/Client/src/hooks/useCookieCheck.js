import { useCallback, useEffect, useRef, useState } from 'react';
import { checkCookiesEnabled } from '../apis/authApi';

/**
 * Checks (once on mount, and again whenever the tab regains focus while
 * blocked) whether the browser accepts the cookies the API sets.
 *
 * status: 'checking' | 'ok' | 'blocked'
 *
 * A network failure is treated as 'ok' so a flaky connection never shows a
 * misleading "cookies blocked" message; the normal error handling covers it.
 */
export function useCookieCheck() {
  const [status, setStatus] = useState('checking');
  const statusRef = useRef(status);
  statusRef.current = status;

  const recheck = useCallback(async () => {
    setStatus('checking');
    try {
      const enabled = await checkCookiesEnabled();
      setStatus(enabled ? 'ok' : 'blocked');
      return enabled;
    } catch {
      setStatus('ok');
      return true;
    }
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck]);

  // The user fixes the setting in another tab/panel, then comes back here:
  // re-test automatically so the prompt clears itself.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && statusRef.current === 'blocked') {
        recheck();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [recheck]);

  return { status, recheck };
}
