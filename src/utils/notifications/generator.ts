import type { UserPlant } from '@/hooks/useUserPlants';
import type { Notification } from '@/types/notificationTypes';
import { calculateWateringSchedule } from '../watering/schedule';

// Navigation helper - will be set by the app
let navigateFunction: ((path: string) => void) | null = null;

export function setNotificationNavigate(navigate: (path: string) => void) {
  navigateFunction = navigate;
}

function navigateToPlants() {
  try {
    if (navigateFunction) {
      navigateFunction('/my-plants');
    } else {
      // Fallback to window.location if navigate not set
      window.location.href = '/my-plants';
    }
  } catch (error) {
    console.error('[notification-generator] Error navigating to plants:', error);
  }
}

/**
 * Generate notifications from plant data
 * This analyzes the current state of plants and creates relevant notifications
 * Creates individual notifications for each plant that needs attention
 */
export function generatePlantNotifications(plants: UserPlant[]): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>[] {
  try {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>[] = [];

    plants.forEach((plant) => {
      const { daysUntilWatering, isOverdue } = calculateWateringSchedule(plant);

      // Create individual notification for overdue plants
      if (isOverdue) {
        const daysOverdue = Math.abs(daysUntilWatering);
        notifications.push({
          type: 'overdue_watering',
          priority: 'high',
          title: 'Plant Overdue',
          message: `${plant.nickname} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue for watering`,
          actions: [
            {
              label: 'Water Now',
              // Store plantId in action metadata instead of onClick function
              // The onClick will be reconstructed in NotificationCenter
              plantId: plant.id,
              variant: 'default',
            },
          ],
          metadata: {
            plantId: plant.id,
            plantName: plant.nickname,
          },
        });
      }
      // Create individual notification for plants due today
      else if (daysUntilWatering === 0) {
        notifications.push({
          type: 'due_today',
          priority: 'medium',
          title: 'Plant Due Today',
          message: `${plant.nickname} should be watered today`,
          actions: [
            {
              label: 'Water Now',
              // Store plantId in action metadata instead of onClick function
              plantId: plant.id,
              variant: 'default',
            },
          ],
          metadata: {
            plantId: plant.id,
            plantName: plant.nickname,
          },
        });
      }
    });

    return notifications;
  } catch (error) {
    console.error('[notification-generator] Error generating plant notifications:', error);
    return [];
  }
}

/**
 * Create a welcome notification for new users
 */
export function createWelcomeNotification(): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> {
  return {
    type: 'info',
    priority: 'low',
    title: 'Welcome to sprouthub!',
    message: 'Start by adding your first plant to begin tracking your plant care journey.',
    actions: [
      {
        label: 'Add Plant',
        onClick: () => {
          navigateToPlants();
        },
        variant: 'default',
      },
    ],
  };
}

/**
 * Create notification for successful plant watering
 */
export function createWateringSuccessNotification(plantName: string): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> {
  return {
    type: 'success',
    priority: 'low',
    title: 'Plant Watered',
    message: `${plantName} has been watered successfully`,
    metadata: {
      plantName,
    },
  };
}

/**
 * Create notification for bulk watering
 */
export function createBulkWateringNotification(count: number): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> {
  return {
    type: 'success',
    priority: 'low',
    title: 'Plants Watered',
    message: `Successfully watered ${count} plant${count > 1 ? 's' : ''}`,
    metadata: {
      count,
    },
  };
}

/**
 * Create notification for pattern insights
 */
export function createPatternInsightNotification(
  plantName: string,
  insight: string
): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> {
  return {
    type: 'pattern_insight',
    priority: 'low',
    title: 'Watering Pattern Insight',
    message: `${plantName}: ${insight}`,
    metadata: {
      plantName,
    },
  };
}
