import { useEffect, useState, useSyncExternalStore } from 'react';
import { isServerWaking, subscribeServerWaking } from '../apis/serverWake';

// Shown at the top of every page while the API server is starting up after
// sleeping (Render free tier). Requests made meanwhile are retried
// automatically, so the user only needs to wait.
function ServerWakingBanner() {
  const waking = useSyncExternalStore(subscribeServerWaking, isServerWaking);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!waking) return undefined;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [waking]);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md rounded-lg border border-primary/30 bg-surface px-4 py-3 text-[13px] text-text shadow-card-hover"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
        <div>
          <p className="font-semibold">Waking up the server…</p>
          <p className="text-text-muted">
            It was idle and is starting again. This usually takes under a minute;
            your request will continue automatically.
            {seconds >= 5 && ` (${seconds}s)`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ServerWakingBanner;
