import { useCallback, useEffect, useState } from 'react';
import { getPaymentStatus } from '../apis/paymentApi';

export function usePaymentStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setData(await getPaymentStatus());
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
