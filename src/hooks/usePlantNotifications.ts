import { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationPreferences } from '@/contexts/NotificationPreferencesContext';
import { useNotificationAcknowledgements } from '@/hooks/useNotificationAcknowledgements';
import { generatePlantNotifications } from '@/utils/notification-generator';
import type { UserPlant } from '@/hooks/useUserPlants';

/**
 * Hook that automatically generates and adds notifications based on plant data
 * Tracks which plants have been notified about to avoid duplicate notifications
 *
 * Acknowledgement state is synced to the database so dismissals persist across devices.
 */
export function usePlantNotifications(plants: UserPlant[], enabled: boolean = true) {
  const { addNotification, notifications } = useNotifications();
  const { preferences } = useNotificationPreferences();
  const { isLoaded, getAcknowledgedIds, acknowledge } = useNotificationAcknowledgements();
  const lastNotificationCheck = useRef<Date | null>(null);

  useEffect(() => {
    try {
      // Wait for acknowledgements to load from DB before generating notifications
      if (!isLoaded) return;
      if (!enabled || !preferences.enabled || plants.length === 0) return;

      // Determine check frequency based on preferences
      const now = new Date();
      if (lastNotificationCheck.current) {
        const timeSinceLastCheck = now.getTime() - lastNotificationCheck.current.getTime();
        const hoursSinceLastCheck = timeSinceLastCheck / (1000 * 60 * 60);
        const daysSinceLastCheck = timeSinceLastCheck / (1000 * 60 * 60 * 24);

        if (preferences.checkFrequency === 'hourly' && hoursSinceLastCheck < 1) {
          return;
        } else if (preferences.checkFrequency === 'daily' && daysSinceLastCheck < 1) {
          return;
        }
      }

      // Generate notifications from current plant state
      const newNotifications = generatePlantNotifications(plants);

      // Add individual plant notifications
      newNotifications.forEach(notification => {
        const type = notification.type;
        const plantId = notification.metadata?.plantId;

        if (!plantId) return;

        const acknowledgedIds = getAcknowledgedIds(type);
        const isAcked = acknowledgedIds.includes(plantId);

        // Acknowledge this plant so it won't re-notify on this device
        // (DB write happens in the background for cross-device sync)
        if (!isAcked) {
          acknowledge(type, plantId);
        }

        // Should we notify?
        let shouldNotify = false;
        if (type === 'overdue_watering' && preferences.overdueWatering) {
          shouldNotify = !isAcked;
        } else if (type === 'due_today' && preferences.dueTodayWatering) {
          shouldNotify = !isAcked;
        }

        if (shouldNotify) {
          // Check for duplicates in current in-memory notifications
          const isDuplicate = notifications.some(n =>
            n.type === type &&
            n.metadata?.plantId === plantId
          );

          if (!isDuplicate) {
            addNotification(notification);
          }
        }
      });

      lastNotificationCheck.current = now;
    } catch (error) {
      console.error('[usePlantNotifications] Error generating notifications:', error);
    }
  }, [plants, addNotification, notifications, enabled, preferences, isLoaded, getAcknowledgedIds, acknowledge]);
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
        icon: undefined,
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
