import { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationPreferences } from '@/contexts/NotificationPreferencesContext';
import { generatePlantNotifications } from '@/utils/notification-generator';
import type { UserPlant } from '@/hooks/useUserPlants';

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

    // Check if we already have active notifications for these conditions
    const hasOverdueNotification = notifications.some(n => n.type === 'overdue_watering' && !n.dismissed);
    const hasDueTodayNotification = notifications.some(n => n.type === 'due_today' && !n.dismissed);
    const hasOverwateringNotification = notifications.some(n => n.type === 'overwatering_risk' && !n.dismissed);

    // Generate notifications from current plant state
    const newNotifications = generatePlantNotifications(plants);

    // Helper to manage acknowledged notifications in local storage
    const getAcknowledgedIds = (type: string): string[] => {
      try {
        const stored = localStorage.getItem(`sprouthub:notification:acknowledged:${type}`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    };

    const setAcknowledgedIds = (type: string, ids: string[]) => {
      try {
        localStorage.setItem(`sprouthub:notification:acknowledged:${type}`, JSON.stringify(ids));
      } catch (e) {
        // ignore
      }
    };

    // Add notifications only if they don't already exist AND user has that type enabled
    // AND we haven't already notified about these specific plants (state tracking)
    newNotifications.forEach(notification => {
      const type = notification.type;
      const currentIds: string[] = notification.metadata?.plantIds || [];
      const acknowledgedIds = getAcknowledgedIds(type);

      // Check if there are any new IDs that haven't been acknowledged
      const hasNewIds = currentIds.some(id => !acknowledgedIds.includes(id));
      
      // Update acknowledged list to match current state (handles plants being watered/fixed)
      // We only update storage if the set has changed to avoid spamming writes
      const currentIdsSet = new Set(currentIds);
      const ackIdsSet = new Set(acknowledgedIds);
      const setsAreEqual = currentIdsSet.size === ackIdsSet.size && 
                          [...currentIdsSet].every(id => ackIdsSet.has(id));
      
      if (!setsAreEqual) {
        setAcknowledgedIds(type, currentIds);
      }

      // Should we notify?
      // 1. User preferences must allow it
      // 2. No active notification of this type (already handled by checks below)
      // 3. There must be NEW plants involved (hasNewIds)
      
      let shouldNotify = false;
      if (type === 'overdue_watering' && !hasOverdueNotification && preferences.overdueWatering) {
        shouldNotify = hasNewIds;
      } else if (type === 'due_today' && !hasDueTodayNotification && preferences.dueTodayWatering) {
        shouldNotify = hasNewIds;
      } else if (type === 'overwatering_risk' && !hasOverwateringNotification && preferences.overwateringRisk) {
        shouldNotify = hasNewIds;
      }

      if (shouldNotify) {
        addNotification(notification);
      }
    });

    lastNotificationCheck.current = now;
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
        title: 'Welcome to SproutHub!',
        message: 'Start by adding your first plant to begin tracking your plant care journey.',
        icon: undefined,
      });
    },
  };
}
