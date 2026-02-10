import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationPreferences } from '@/contexts/NotificationPreferencesContext';
import { generatePlantNotifications } from '@/utils/notification-generator';
import { safeJsonParse } from '@/utils/safeJsonParse';
import type { UserPlant } from '@/hooks/useUserPlants';

const acknowledgedIdsSchema = z.array(z.string());

/**
 * Hook that automatically generates and adds notifications based on plant data
 * Tracks which plants have been notified about to avoid duplicate notifications
 */
export function usePlantNotifications(plants: UserPlant[], enabled: boolean = true) {
  const { addNotification, notifications } = useNotifications();
  const { preferences } = useNotificationPreferences();
  const lastNotificationCheck = useRef<Date | null>(null);
  const notifiedPlantStates = useRef<Map<string, { isOverdue: boolean; isDueToday: boolean; hasOverwateringRisk: boolean }>>(new Map());

  useEffect(() => {
    // Wrap the entire effect in a try-catch to prevent crashes
    try {
      // Check if notifications are globally disabled or locally disabled
      if (!enabled || !preferences.enabled || plants.length === 0) return;

      // Determine check frequency based on preferences
      const now = new Date();
      if (lastNotificationCheck.current) {
        const timeSinceLastCheck = now.getTime() - lastNotificationCheck.current.getTime();
        const hoursSinceLastCheck = timeSinceLastCheck / (1000 * 60 * 60);
        const daysSinceLastCheck = timeSinceLastCheck / (1000 * 60 * 60 * 24);

        // Skip based on check frequency preference
        if (preferences.checkFrequency === 'hourly' && hoursSinceLastCheck < 1) {
          return;
        } else if (preferences.checkFrequency === 'daily' && daysSinceLastCheck < 1) {
          return;
        }
        // realtime always proceeds (no skip)
      }

      // Generate notifications from current plant state
      const newNotifications = generatePlantNotifications(plants);

    // Helper to manage acknowledged notifications in local storage
    const getAcknowledgedIds = (type: string): string[] => {
      try {
        // Clear acknowledgements daily for all watering notification types
        // This ensures plants that still need watering get fresh notifications each day
        const lastAckDate = localStorage.getItem(`sprouthub:notification:acknowledged:${type}:date`);
        const today = new Date().toDateString();
        
        if (lastAckDate !== today) {
          // New day, clear acknowledgements so notifications can be re-created
          localStorage.removeItem(`sprouthub:notification:acknowledged:${type}`);
          localStorage.setItem(`sprouthub:notification:acknowledged:${type}:date`, today);
          return [];
        }

        const stored = localStorage.getItem(`sprouthub:notification:acknowledged:${type}`);
        return safeJsonParse(stored, acknowledgedIdsSchema, []);
      } catch (e) {
        return [];
      }
    };

    const setAcknowledgedIds = (type: string, ids: string[]) => {
      try {
        localStorage.setItem(`sprouthub:notification:acknowledged:${type}`, JSON.stringify(ids));
        localStorage.setItem(`sprouthub:notification:acknowledged:${type}:date`, new Date().toDateString());
      } catch (e) {
        // ignore
      }
    };

    // Add individual plant notifications
    newNotifications.forEach(notification => {
      const type = notification.type;
      const plantId = notification.metadata?.plantId;

      if (!plantId) return; // Skip if no plantId

      const acknowledgedIds = getAcknowledgedIds(type);

      // Check if this specific plant has been acknowledged
      const isAcknowledged = acknowledgedIds.includes(plantId);

      // Update acknowledged list to include this plant
      if (!isAcknowledged) {
        setAcknowledgedIds(type, [...acknowledgedIds, plantId]);
      }

      // Should we notify?
      // 1. User preferences must allow it
      // 2. This plant hasn't been acknowledged yet
      let shouldNotify = false;
      if (type === 'overdue_watering' && preferences.overdueWatering) {
        shouldNotify = !isAcknowledged;
      } else if (type === 'due_today' && preferences.dueTodayWatering) {
        shouldNotify = !isAcknowledged;
      }

      if (shouldNotify) {
        // Check for duplicates by plantId to prevent adding the same notification twice
        const isDuplicate = notifications.some(n =>
          n.type === type &&
          !n.dismissed &&
          n.metadata?.plantId === plantId
        );

        if (!isDuplicate) {
           addNotification(notification);
        }
      }
    });

      lastNotificationCheck.current = now;
    } catch (error) {
      // Log error to console but don't crash the app
      console.error('[usePlantNotifications] Error generating notifications:', error);
    }
  }, [plants, addNotification, notifications, enabled, preferences]);
}

/**
 * Hook to manually trigger notification creation
 * Use this for user actions like watering plants
 */
export function useManualNotifications() {
  const { addNotification } = useNotifications();
  const { preferences } = useNotificationPreferences();

  return {
    notifyWateringSuccess: (plantName: string) => {
      if (!preferences.enabled || !preferences.wateringSuccess) return;

      addNotification({
        type: 'success',
        priority: 'low',
        title: 'Plant Watered',
        message: `${plantName} has been watered successfully`,
        icon: undefined, // Will use default icon from notification component
        metadata: { plantName },
      });
    },

    notifyBulkWatering: (count: number) => {
      if (!preferences.enabled || !preferences.bulkActions) return;

      addNotification({
        type: 'success',
        priority: 'low',
        title: 'Plants Watered',
        message: `Successfully watered ${count} plant${count > 1 ? 's' : ''}`,
        icon: undefined,
        metadata: { count },
      });
    },

    notifyPatternInsight: (plantName: string, insight: string) => {
      if (!preferences.enabled || !preferences.patternInsights) return;

      addNotification({
        type: 'pattern_insight',
        priority: 'low',
        title: 'Watering Pattern Insight',
        message: `${plantName}: ${insight}`,
        icon: undefined,
        metadata: { plantName },
      });
    },

    notifyWelcome: () => {
      if (!preferences.enabled) return;

      addNotification({
        type: 'info',
        priority: 'low',
        title: 'Welcome to sprouthub!',
        message: 'Start by adding your first plant to begin tracking your plant care journey.',
        icon: undefined,
      });
    },
  };
}
