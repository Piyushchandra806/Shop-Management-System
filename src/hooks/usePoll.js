import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom React hook that polls an API endpoint at a set interval.
 * It automatically pauses polling when the browser tab is hidden/inactive.
 * It uses JSON serialization to perform a deep equality comparison and prevent
 * unnecessary component re-renders when the data has not changed.
 *
 * @param {string} url - The API endpoint to poll.
 * @param {number} intervalMs - Polling interval in milliseconds (default 10000).
 * @returns {object} { data, loading, error, refresh }
 */
export function usePoll(url, intervalMs = 10000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousDataStr = useRef('');
  const activeInterval = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      const jsonStr = JSON.stringify(json);
      
      // Update state only if the data has actually changed
      if (jsonStr !== previousDataStr.current) {
        previousDataStr.current = jsonStr;
        setData(json);
      }
      setError(null);
    } catch (err) {
      console.error(`usePoll error for ${url}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // Perform initial fetch
    fetchData();

    // Start polling interval
    const startPolling = () => {
      if (!activeInterval.current) {
        activeInterval.current = setInterval(fetchData, intervalMs);
      }
    };

    // Stop polling interval
    const stopPolling = () => {
      if (activeInterval.current) {
        clearInterval(activeInterval.current);
        activeInterval.current = null;
      }
    };

    // Start initially
    startPolling();

    // Pause/Resume polling based on page visibility state
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchData();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount or URL/interval change
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, intervalMs]);

  return { data, loading, error, refresh: fetchData };
}
