import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Initial mock notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nueva propuesta recibida',
    message: 'Juan García ha enviado una nueva propuesta: "Sistema de Gestión Académica"',
    type: 'proposal',
    read: false,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    metadata: { proposalId: 'prop-001' }
  },
  {
    id: '2',
    title: 'Evaluación pendiente',
    message: 'Tienes 3 propuestas pendientes de evaluación',
    type: 'evaluation',
    read: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
  },
  {
    id: '3',
    title: 'Cambio de estado',
    message: 'La propuesta "Plataforma E-Learning" ha pasado a "En Revisión"',
    type: 'status',
    read: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    metadata: { proposalId: 'prop-002', oldStatus: 'Borrador', newStatus: 'En Revisión' }
  },
  {
    id: '4',
    title: 'Fecha límite próxima',
    message: 'La propuesta "Modernización de Infraestructura" vence en 2 días',
    type: 'deadline',
    read: false,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    metadata: { proposalId: 'prop-003' }
  },
  {
    id: '5',
    title: 'Actualización del sistema',
    message: 'Se han actualizado las rúbricas de evaluación',
    type: 'system',
    read: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

// Simulated events that will trigger notifications
const simulatedEvents = [
  {
    delay: 15000, // 15 seconds
    notification: {
      title: 'Nueva propuesta recibida',
      message: 'María López ha enviado: "Programa de Becas Estudiantiles"',
      type: 'proposal' as NotificationType,
      metadata: { proposalId: 'prop-004' }
    }
  },
  {
    delay: 30000, // 30 seconds
    notification: {
      title: 'Evaluación completada',
      message: 'Carlos Ruiz ha completado la evaluación de "Sistema de Gestión Académica"',
      type: 'evaluation' as NotificationType,
      metadata: { proposalId: 'prop-001', evaluationId: 'eval-001' }
    }
  },
  {
    delay: 45000, // 45 seconds
    notification: {
      title: 'Propuesta aprobada',
      message: 'La propuesta "Plataforma E-Learning" ha sido aprobada',
      type: 'status' as NotificationType,
      metadata: { proposalId: 'prop-002', oldStatus: 'En Revisión', newStatus: 'Aprobada' }
    }
  },
  {
    delay: 60000, // 60 seconds
    notification: {
      title: 'Recordatorio de fecha límite',
      message: 'Tienes 2 evaluaciones que vencen mañana',
      type: 'deadline' as NotificationType,
    }
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const filterByType = useCallback((type: NotificationType | 'all') => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Simulate automatic notifications
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    simulatedEvents.forEach(event => {
      const timeout = setTimeout(() => {
        addNotification(event.notification);
      }, event.delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Only run once on mount

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

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
