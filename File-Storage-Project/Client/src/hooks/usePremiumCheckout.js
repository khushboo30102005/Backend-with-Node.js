import { useCallback, useState } from 'react';
import { startPremiumCheckout } from '../utils/razorpayCheckout';

// Runs the Premium checkout and turns the outcome into a message for the UI.
// `onDone` runs after any attempt that may have changed the plan, so the page
// can reload its data.
export function usePremiumCheckout(onDone) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { kind: 'success'|'error'|'info', text }

  const start = useCallback(async () => {
    if (busy) return; // ignore double clicks
    setBusy(true);
    setMessage(null);
    try {
      const result = await startPremiumCheckout();
      if (result.status === 'paid') {
        setMessage({
          kind: 'success',
          text: result.data?.duplicate
            ? 'This payment was already applied. Premium is active.'
            : 'Payment successful. Premium is now active.',
        });
        window.dispatchEvent(new Event('storage-changed')); // refresh sidebar storage
      } else if (result.status === 'cancelled') {
        setMessage({ kind: 'info', text: 'Payment cancelled. You have not been charged.' });
      } else if (result.status === 'pending') {
        setMessage({
          kind: 'info',
          text: `${result.message} If you were charged, Premium will activate automatically in a moment.`,
        });
      } else {
        setMessage({ kind: 'error', text: result.message || 'The payment could not be completed.' });
      }
    } catch (err) {
      setMessage({
        kind: 'error',
        text:
          err.response?.data?.error ||
          err.message ||
          'Could not start the payment. Please try again.',
      });
    } finally {
      setBusy(false);
      onDone?.();
    }
  }, [busy, onDone]);

  return { busy, message, start, clearMessage: () => setMessage(null) };
}
