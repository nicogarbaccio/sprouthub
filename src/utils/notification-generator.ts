import type { UserPlant } from '@/hooks/useUserPlants';
import type { Notification, NotificationType, NotificationPriority } from '@/types/notificationTypes';
import { calculateWateringSchedule } from './watering-schedule';
import { shouldShowOverwateringWarning } from './overwatering';

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
 */
export function generatePlantNotifications(plants: UserPlant[]): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>[] {
  try {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>[] = [];

    // Track counts for summary notifications
    let overduePlants: UserPlant[] = [];
    let dueTodayPlants: UserPlant[] = [];
    let overwateringRiskPlants: UserPlant[] = [];

    plants.forEach((plant) => {
      const { daysUntilWatering, isOverdue } = calculateWateringSchedule(plant);
      const { showWarning: hasOverwateringRisk } = shouldShowOverwateringWarning(
        plant.latest_watering,
        plant.suggested_watering_days || 7
      );

      // Collect overdue plants
      if (isOverdue) {
        overduePlants.push(plant);
      }

      // Collect plants due today
      if (daysUntilWatering === 0 && !isOverdue) {
        dueTodayPlants.push(plant);
      }
    });

  // Create overdue notification (high priority)
  if (overduePlants.length > 0) {
    const plantNames = overduePlants.slice(0, 3).map(p => p.nickname).join(', ');
    const moreCount = overduePlants.length > 3 ? ` and ${overduePlants.length - 3} more` : '';

    notifications.push({
      type: 'overdue_watering',
      priority: 'high',
      title: `${overduePlants.length} Plant${overduePlants.length > 1 ? 's' : ''} Overdue`,
      message: `${plantNames}${moreCount} ${overduePlants.length > 1 ? 'need' : 'needs'} watering`,
      actions: [
        {
          label: overduePlants.length === 1 ? 'Water Now' : 'View Plants',
          onClick: () => {
            // If only one plant, navigate directly to its details page
            // Otherwise, navigate to My Plants page
            if (overduePlants.length === 1) {
              const plantId = overduePlants[0].id;
              if (navigateFunction) {
                navigateFunction(`/my-plants/${plantId}`);
              } else {
                window.location.href = `/my-plants/${plantId}`;
              }
            } else {
              navigateToPlants();
            }
          },
          variant: 'default',
        },
      ],
      metadata: {
        count: overduePlants.length,
        plantIds: overduePlants.map(p => p.id),
      },
    });
  }

  // Create due today notification (medium priority)
  if (dueTodayPlants.length > 0) {
    const plantNames = dueTodayPlants.slice(0, 3).map(p => p.nickname).join(', ');
    const moreCount = dueTodayPlants.length > 3 ? ` and ${dueTodayPlants.length - 3} more` : '';

    notifications.push({
      type: 'due_today',
      priority: 'medium',
      title: `${dueTodayPlants.length} Plant${dueTodayPlants.length > 1 ? 's' : ''} Due Today`,
      message: `${plantNames}${moreCount} should be watered today`,
      actions: [
        {
          label: 'Water Now',
          onClick: () => {
            // If only one plant, navigate directly to its details page
            // Otherwise, navigate to My Plants page
            if (dueTodayPlants.length === 1) {
              const plantId = dueTodayPlants[0].id;
              if (navigateFunction) {
                navigateFunction(`/my-plants/${plantId}`);
              } else {
                window.location.href = `/my-plants/${plantId}`;
              }
            } else {
              navigateToPlants();
            }
          },
          variant: 'default',
        },
      ],
      metadata: {
        count: dueTodayPlants.length,
        plantIds: dueTodayPlants.map(p => p.id),
      },
    });
  }

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
