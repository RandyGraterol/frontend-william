import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  userId: string | undefined;
  interval?: number;
  onNewNotification?: (data: {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    createdAt: string;
  }) => void;
}

export function usePolling({ userId, interval = 15000, onNewNotification }: UsePollingOptions) {
  const knownNotifIdsRef = useRef<Set<string>>(new Set());
  const onNewNotificationRef = useRef(onNewNotification);
  onNewNotificationRef.current = onNewNotification;

  const check = useCallback(async () => {
    if (!userId) return;

    try {
      const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${RAW_API_URL}/api/notifications?userId=${userId}&limit=5`);
      const json = await res.json();

      if (!json?.success || !Array.isArray(json.data)) return;

      const notifications = json.data;

      if (knownNotifIdsRef.current.size === 0) {
        notifications.forEach((n: any) => knownNotifIdsRef.current.add(n.id));
        return;
      }

      for (const n of notifications) {
        if (knownNotifIdsRef.current.has(n.id)) break;
        knownNotifIdsRef.current.add(n.id);
        onNewNotificationRef.current?.({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link ?? undefined,
          createdAt: n.createdAt,
        });
      }
    } catch {
      // Silently fail
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    check();

    const intervalId = setInterval(check, interval);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId, interval, check]);
}
