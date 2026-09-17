import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Drop-in replacement for useState for user-facing error strings.
 * Setting a non-empty error automatically clears it after `timeoutMs`.
 * Setting a new error before the timer fires resets the timer (no stale
 * timeout can clear a newer error). Setting an empty string clears
 * immediately and cancels any pending timer. Timer is cleaned up on
 * unmount to avoid a "set state on unmounted component" warning/leak.
 */
export function useAutoDismissError(timeoutMs = 5000) {
  const [error, setErrorState] = useState('');
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const setError = useCallback(
    (message) => {
      clearTimer();
      setErrorState(message);
      if (message) {
        timerRef.current = setTimeout(() => {
          setErrorState('');
          timerRef.current = null;
        }, timeoutMs);
      }
    },
    [timeoutMs],
  );

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return [error, setError];
}