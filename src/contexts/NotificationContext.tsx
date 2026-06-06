import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export type NotificationType = 'proposal' | 'evaluation' | 'status' | 'system' | 'deadline';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: Date;
  link?: string;
  metadata?: {
    proposalId?: string;
    evaluationId?: string;
    oldStatus?: string;
    newStatus?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  filterByType: (type: NotificationType | 'all') => Notification[];
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Map backend notification types to frontend types
function mapBackendType(type: string): NotificationType {
  switch (type) {
    case 'proposal':
      return 'proposal';
    case 'evaluation':
      return 'evaluation';
    case 'status':
      return 'status';
    case 'system':
    case 'welcome':
    case 'password_reset':
    case 'invitation':
    case 'activity':
      return 'system';
    case 'deadline':
    case 'deadline_reminder':
      return 'deadline';
    default:
      return 'system';
  }
}

function mapApiNotification(item: Record<string, any>): Notification {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: mapBackendType(item.type || 'system'),
    read: item.isRead || false,
    timestamp: new Date(item.createdAt),
    link: item.link,
    metadata: item.link ? { proposalId: item.link.split('/').pop() } : undefined,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Fetch notifications from API on mount
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await api.getNotifications(user.id);
      if (response.success && response.data) {
        const mapped = (response.data as Record<string, any>[]).map(mapApiNotification);
        setNotifications(mapped);
      }
    } catch {
      // Silent fail - notifications are not critical
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Define addNotification first so it can be used by ref
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for new notifications
    const toastVariant = notification.type === 'deadline' ? 'destructive' : 'default';
    toast({
      title: notification.title,
      description: notification.message,
      variant: toastVariant,
    });
  }, []);

  // Use a ref to keep the latest addNotification for socket callbacks
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  // Connect to Socket.io for real-time notifications
  const handleSocketNotification = useCallback((data: {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    createdAt: string;
  }) => {
    const notificationType = mapBackendType(data.type);
    // Use ref to avoid stale closure issues
    addNotificationRef.current({
      title: data.title,
      message: data.message,
      type: notificationType,
      link: data.link,
      metadata: data.link ? { proposalId: data.link.split('/').pop() } : undefined,
    });
  }, []);

  useSocket({
    token: user ? localStorage.getItem('token') : null,
    userId: user?.id,
    role: user?.role,
    onNotification: handleSocketNotification,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    if (id.startsWith('notif-')) return;
    try {
      await api.markNotificationAsRead(id);
    } catch {
      // Silent fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsAsRead(user?.id || '');
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (id.startsWith('notif-')) return;
    try {
      await api.deleteNotification(id);
    } catch {
      // Silent fail
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await api.clearAllNotifications(user?.id || '');
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  const filterByType = useCallback((type: NotificationType | 'all') => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        filterByType,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
