// usePolling hook — provides simple polling for data freshness

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook that polls an async function at a set interval.
 *
 * @param {Function} fetchFn - Async function that returns data
 * @param {number} interval - Polling interval in ms (default 10s)
 * @param {boolean} enabled - Whether polling is active
 */
export function usePolling(fetchFn, interval = 10000, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const savedFn = useRef(fetchFn);

  // Keep ref current
  useEffect(() => {
    savedFn.current = fetchFn;
  }, [fetchFn]);

  const refetch = useCallback(async () => {
    await Promise.resolve(); // Defer state updates to avoid synchronous setState in useEffect
    try {
      setError(null);
      const result = await savedFn.current();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch(); // Initial fetch

    if (!enabled) return;

    const id = setInterval(refetch, interval);
    return () => clearInterval(id);
  }, [refetch, interval, enabled]);

  return { data, loading, error, refetch };
}
