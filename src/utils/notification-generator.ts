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
  if (navigateFunction) {
    navigateFunction('/my-plants');
  } else {
    // Fallback to window.location if navigate not set
    window.location.href = '/my-plants';
  }
}

/**
 * Generate notifications from plant data
 * This analyzes the current state of plants and creates relevant notifications
 */
export function generatePlantNotifications(plants: UserPlant[]): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>[] {
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

    // Collect overwatering risks
    if (hasOverwateringRisk) {
      overwateringRiskPlants.push(plant);
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
          label: 'View Plants',
          onClick: () => {
            navigateToPlants();
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
            navigateToPlants();
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

  // Create overwatering risk notification (medium priority)
  if (overwateringRiskPlants.length > 0) {
    const plantNames = overwateringRiskPlants.slice(0, 3).map(p => p.nickname).join(', ');
    const moreCount = overwateringRiskPlants.length > 3 ? ` and ${overwateringRiskPlants.length - 3} more` : '';

    notifications.push({
      type: 'overwatering_risk',
      priority: 'medium',
      title: 'Overwatering Risk Detected',
      message: `${plantNames}${moreCount} may be getting too much water`,
      actions: [
        {
          label: 'Review',
          onClick: () => {
            navigateToPlants();
          },
          variant: 'outline',
        },
      ],
      metadata: {
        count: overwateringRiskPlants.length,
        plantIds: overwateringRiskPlants.map(p => p.id),
      },
    });
  }

  return notifications;
}

/**
 * Create a welcome notification for new users
 */
export function createWelcomeNotification(): Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'> {
  return {
    type: 'info',
    priority: 'low',
    title: 'Welcome to SproutHub!',
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
