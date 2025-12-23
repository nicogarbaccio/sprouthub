import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Notification, NotificationGroup, NotificationType } from '@/types/notificationTypes';
import { storage } from '@/utils/storage';
import { NOTIFICATIONS, TIMING } from '@/lib/constants';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getGroupedNotifications: () => NotificationGroup[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'sprouthub_notifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from storage on mount
  useEffect(() => {
    const stored = storage.getItem<Notification[]>(STORAGE_KEY, {
      version: NOTIFICATIONS.STORAGE_VERSION,
      validate: (data) => Array.isArray(data),
    });

    if (stored) {
      // Convert timestamp strings back to Date objects
      const notificationsWithDates = stored.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
      setNotifications(notificationsWithDates);
    }
  }, []);

  // Save notifications to storage with debouncing to optimize performance
  useEffect(() => {
    if (notifications.length > 0) {
      // Debounce storage writes to avoid excessive writes when notifications are added rapidly
      const timeoutId = setTimeout(() => {
        // Exclude icon property as React components can't be serialized
        const serializableNotifications = notifications.map(({ icon, ...rest }) => rest);
        storage.setItem(STORAGE_KEY, serializableNotifications, {
          version: NOTIFICATIONS.STORAGE_VERSION,
        });
      }, TIMING.STORAGE_WRITE_DEBOUNCE);

      return () => clearTimeout(timeoutId);
    }
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      dismissed: false,
    };

    setNotifications(prev => {
      // Add new notification and keep only the last N notifications
      const updated = [newNotification, ...prev].slice(0, NOTIFICATIONS.MAX_NOTIFICATIONS);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, dismissed: true } : n))
    );
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, dismissed: true }))
    );
  }, []);

  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type && !n.dismissed);
  }, [notifications]);

  const getGroupedNotifications = useCallback((): NotificationGroup[] => {
    const groups = new Map<NotificationType, NotificationGroup>();

    notifications
      .filter(n => !n.dismissed)
      .forEach(notification => {
        const existing = groups.get(notification.type);

        if (existing) {
          existing.notifications.push(notification);
          existing.count++;
          if (notification.timestamp > existing.latestTimestamp) {
            existing.latestTimestamp = notification.timestamp;
          }
          // Set priority to highest among notifications
          if (notification.priority === 'urgent' || existing.priority === 'urgent') {
            existing.priority = 'urgent';
          } else if (notification.priority === 'high' || existing.priority === 'high') {
            existing.priority = 'high';
          } else if (notification.priority === 'medium' || existing.priority === 'medium') {
            existing.priority = 'medium';
          }
        } else {
          groups.set(notification.type, {
            type: notification.type,
            priority: notification.priority,
            count: 1,
            notifications: [notification],
            latestTimestamp: notification.timestamp,
          });
        }
      });

    return Array.from(groups.values()).sort((a, b) => {
      // Sort by priority first, then by latest timestamp
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.latestTimestamp.getTime() - a.latestTimestamp.getTime();
    });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications.filter(n => !n.dismissed),
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        dismissAll,
        getNotificationsByType,
        getGroupedNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
