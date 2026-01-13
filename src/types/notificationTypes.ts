/**
 * Notification System Types
 * Defines the structure for the unified notification center
 */

export type NotificationType =
  | 'overdue_watering'      // Plants overdue for watering
  | 'due_today'             // Plants due for watering today
  | 'overwatering_risk'     // Overwatering risk detected
  | 'seasonal_transition'   // Season change detected
  | 'weather_alert'         // Weather-related alerts
  | 'pattern_insight'       // Watering pattern insights
  | 'household_invite'      // Household invitation
  | 'system'                // System messages
  | 'success'               // Success messages
  | 'info';                 // General information

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationAction {
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  // Optional plantId for navigation - will be used to reconstruct onClick if needed
  plantId?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: NotificationAction[];
  // Optional metadata for different notification types
  metadata?: {
    plantId?: string;
    plantName?: string;
    householdId?: string;
    count?: number;
    [key: string]: any;
  };
}

export interface NotificationGroup {
  type: NotificationType;
  priority: NotificationPriority;
  count: number;
  notifications: Notification[];
  latestTimestamp: Date;
}
