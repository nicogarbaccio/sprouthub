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
    // We check this to avoid duplicates, BUT if we found new IDs that need notifying,
    // we should proceed regardless of whether there's an existing notification.
    const hasOverdueNotification = notifications.some(n => n.type === 'overdue_watering' && !n.dismissed);
    const hasDueTodayNotification = notifications.some(n => n.type === 'due_today' && !n.dismissed);

    // Generate notifications from current plant state
    const newNotifications = generatePlantNotifications(plants);

    // Helper to manage acknowledged notifications in local storage
    const getAcknowledgedIds = (type: string): string[] => {
      try {
        // For overdue watering, we want to clear acknowledgements daily to ensure daily reminders
        if (type === 'overdue_watering') {
          const lastAckDate = localStorage.getItem(`sprouthub:notification:acknowledged:${type}:date`);
          const today = new Date().toDateString();
          
          if (lastAckDate !== today) {
            // New day, clear acknowledgements for overdue plants
            localStorage.removeItem(`sprouthub:notification:acknowledged:${type}`);
            localStorage.setItem(`sprouthub:notification:acknowledged:${type}:date`, today);
            return [];
          }
        }

        const stored = localStorage.getItem(`sprouthub:notification:acknowledged:${type}`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    };

    const setAcknowledgedIds = (type: string, ids: string[]) => {
      try {
        localStorage.setItem(`sprouthub:notification:acknowledged:${type}`, JSON.stringify(ids));
        if (type === 'overdue_watering') {
          localStorage.setItem(`sprouthub:notification:acknowledged:${type}:date`, new Date().toDateString());
        }
      } catch (e) {
        // ignore
      }
    };

    // Add notifications only if they don't already exist OR if there are new plants to notify about
    newNotifications.forEach(notification => {
      const type = notification.type;
      const currentIds: string[] = notification.metadata?.plantIds || [];
      const acknowledgedIds = getAcknowledgedIds(type);

      // Check if there are any new IDs that haven't been acknowledged
      // If acknowledgedIds is empty (e.g. after storage clear), hasNewIds will be true for all currentIds
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
      // 2. We must have new plants to notify about (hasNewIds)
      // 3. We allow multiple notifications of the same type if they are about different plants (implied by hasNewIds)
      //    OR if the previous one was dismissed (checked at start of effect)
      
      let shouldNotify = false;
      if (type === 'overdue_watering' && preferences.overdueWatering) {
        // Notify if we have new unacknowledged plants, regardless of existing notifications
        // The existing notification check was preventing regeneration after clearing storage/dismissal
        shouldNotify = hasNewIds; 
      } else if (type === 'due_today' && preferences.dueTodayWatering) {
        shouldNotify = hasNewIds;
      }

      if (shouldNotify) {
        // If there's already an active notification of this type, we might want to update it instead of adding a new one
        // But for now, adding a new one ensures visibility. The context handles distinct IDs.
        
        // Prevent adding duplicate notification if one already exists with the EXACT same content
        // This is a safety check against rapid re-renders
        const isDuplicate = notifications.some(n => 
          n.type === type && 
          !n.dismissed && 
          JSON.stringify(n.metadata?.plantIds) === JSON.stringify(currentIds)
        );

        if (!isDuplicate) {
           addNotification(notification);
        }
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
        title: 'Welcome to sprouthub!',
        message: 'Start by adding your first plant to begin tracking your plant care journey.',
        icon: undefined,
      });
    },
  };
}
