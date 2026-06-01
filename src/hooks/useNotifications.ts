import { useCallback } from 'react';
import { useAlexStore } from '../store/useAlexStore';

/**
 * Notification system hook for Alex V9 AI Trading Dashboard.
 * Provides a unified interface for creating, reading, and managing
 * trading-related notifications with optional browser push support.
 */
export function useNotifications() {
  const notifications = useAlexStore((s) => s.notifications);
  const addNotification = useAlexStore((s) => s.addNotification);
  const markRead = useAlexStore((s) => s.markNotificationRead);
  const clear = useAlexStore((s) => s.clearNotifications);
  const enabled = useAlexStore((s) => s.settings.notificationsEnabled);

  /**
   * Send a new notification. Silently returns if notifications are disabled.
   */
  const notify = useCallback(
    (
      type: 'entry' | 'exit' | 'signal' | 'refresh' | 'warning',
      title: string,
      message: string
    ) => {
      if (!enabled) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

      addNotification({
        id,
        time: new Date().toISOString(),
        type,
        title,
        message,
        read: false,
      });

      // Also show browser toast if permission granted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(title, {
          body: message,
          icon: '/alex-avatar.png',
        });
      }
    },
    [enabled, addNotification]
  );

  /**
   * Request browser notification permission (one-time prompt).
   */
  const requestPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /** Number of unread notifications */
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    notify,
    markRead,
    clear,
    requestPermission,
  };
}
