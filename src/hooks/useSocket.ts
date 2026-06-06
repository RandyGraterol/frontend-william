import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const RAW_SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = RAW_SOCKET_URL.replace(/\/api\/?$/, '');
const SOCKET_PATH = (() => {
  try {
    const url = new URL(SOCKET_URL);
    const basePath = url.pathname === '/' ? '' : url.pathname;
    return `${basePath}/socket.io`;
  } catch {
    return '/socket.io';
  }
})();

interface UseSocketOptions {
  token: string | null;
  userId?: string;
  role?: string;
  onNotification?: (data: {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    createdAt: string;
  }) => void;
}

/**
 * Hook to manage Socket.io connection for real-time notifications
 * Automatically connects/disconnects based on auth state
 */
export function useSocket({ token, userId, role, onNotification }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  const connect = useCallback(() => {
    // Always disconnect first to ensure clean slate with current token
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      auth: {
        token,
        role,
      },
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      // Connection established
    });

    socket.on('notification', (data) => {
      onNotificationRef.current?.(data);
    });

    socket.on('disconnect', () => {
      // Connection closed
    });

    socket.on('connect_error', () => {
      // Connection error
    });

    socketRef.current = socket;
  }, [token, role]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinProposal = useCallback((proposalId: string) => {
    socketRef.current?.emit('join:proposal', proposalId);
  }, []);

  const leaveProposal = useCallback((proposalId: string) => {
    socketRef.current?.emit('leave:proposal', proposalId);
  }, []);

  const joinActivity = useCallback((activityId: string) => {
    socketRef.current?.emit('join:activity', activityId);
  }, []);

  const leaveActivity = useCallback((activityId: string) => {
    socketRef.current?.emit('leave:activity', activityId);
  }, []);

  // Connect when token is available, disconnect when not
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    socket: socketRef.current,
    joinProposal,
    leaveProposal,
    joinActivity,
    leaveActivity,
  };
}
