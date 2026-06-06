import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Centralizes the auto-refresh pattern used across the app:
 * - Re-fetches data whenever the route changes (navigation back/forward)
 * - Silently re-fetches when the window regains focus (tab switch)
 *
 * @param callback - Function to call on navigation and focus events
 *
 * @example
 * ```tsx
 * const fetchData = useCallback(async (showLoader = true) => {
 *   if (showLoader) setIsLoading(true);
 *   // ... fetch logic ...
 *   setIsLoading(false);
 * }, []);
 *
 * useAutoRefresh(() => { fetchData(false); });
 * ```
 */
export function useAutoRefresh(callback: () => void) {
  const location = useLocation();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Fetch on mount and whenever the route changes (navigation back, etc.)
  useEffect(() => {
    callbackRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Silently re-fetch when the window regains focus (e.g., returning from another tab)
  useEffect(() => {
    const handleFocus = () => callbackRef.current();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}
