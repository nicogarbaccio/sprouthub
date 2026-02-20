import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNotificationAcknowledgements } from "@/hooks/useNotificationAcknowledgements";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Trash2,
  Droplets,
  AlertTriangle,
  Calendar,
  Cloud,
  Lightbulb,
  Users,
  Info,
  CheckCircle,
  X,
  CheckCheck,
  Eye,
} from "lucide-react";
import type { NotificationType, Notification } from "@/types/notificationTypes";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  overdue_watering: Droplets,
  due_today: Droplets,
  overwatering_risk: AlertTriangle,
  seasonal_transition: Calendar,
  weather_alert: Cloud,
  pattern_insight: Lightbulb,
  household_invite: Users,
  system: Info,
  success: CheckCircle,
  info: Info,
};

const notificationColors: Record<NotificationType, string> = {
  overdue_watering: "text-red-500",
  due_today: "text-blue-500",
  overwatering_risk: "text-amber-500",
  seasonal_transition: "text-blue-500",
  weather_alert: "text-sky-500",
  pattern_insight: "text-purple-500",
  household_invite: "text-green-500",
  system: "text-gray-500",
  success: "text-green-500",
  info: "text-blue-500",
};

const notificationAccentColors: Record<NotificationType, string> = {
  overdue_watering: "bg-red-500",
  due_today: "bg-blue-500",
  overwatering_risk: "bg-amber-500",
  seasonal_transition: "bg-blue-500",
  weather_alert: "bg-sky-500",
  pattern_insight: "bg-purple-500",
  household_invite: "bg-green-500",
  system: "bg-gray-400",
  success: "bg-green-500",
  info: "bg-blue-500",
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
  } = useNotifications();
  const { acknowledge, acknowledgeBatch } = useNotificationAcknowledgements();

  // Dismiss a notification and persist the acknowledgement to the database
  const handleDismiss = useCallback(
    (notification: Notification) => {
      dismissNotification(notification.id);
      if (notification.metadata?.plantId) {
        acknowledge(notification.type, notification.metadata.plantId);
      }
    },
    [dismissNotification, acknowledge]
  );

  // Dismiss all notifications and persist acknowledgements to the database
  const handleDismissAll = useCallback(() => {
    const plantNotifications = notifications
      .filter((n) => n.metadata?.plantId)
      .map((n) => ({
        notificationType: n.type,
        plantId: n.metadata!.plantId!,
      }));

    dismissAll();
    if (plantNotifications.length > 0) {
      acknowledgeBatch(plantNotifications);
    }
  }, [dismissAll, notifications, acknowledgeBatch]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md !p-0 !gap-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-3 pr-14 shrink-0">
          <SheetHeader className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-5 px-1.5 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Notifications will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4 pb-4">
              {notifications.map((notification) => {
                const Icon =
                  notification.icon || notificationIcons[notification.type];
                const iconColor = notificationColors[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-lg border transition-all overflow-hidden",
                      !notification.read
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-sm"
                        : "bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className="flex">
                      {/* Accent bar */}
                      <div
                        className={cn(
                          "w-1 shrink-0 rounded-l-lg",
                          notificationAccentColors[notification.type]
                        )}
                      />
                    {/* Content and action button */}
                    <div className="flex-1 flex items-start justify-between gap-4 p-4">
                      {/* Left: Text content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 pr-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Timestamp and action buttons */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                Read
                              </button>
                            )}
                            <button
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(notification);
                              }}
                            >
                              <X className="h-3 w-3" />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action icon button (droplet for water notifications) */}
                      {notification.actions &&
                        notification.actions.length > 0 && (
                          <button
                            className="h-12 w-12 rounded-full shrink-0 bg-sprout-water text-white hover:opacity-90 flex items-center justify-center transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              const action = notification.actions![0];

                              // Close drawer first
                              onOpenChange(false);

                              // Then navigate
                              setTimeout(() => {
                                if (!action.onClick && action.plantId) {
                                  navigate(`/my-plants/${action.plantId}`);
                                } else if (action.onClick) {
                                  action.onClick();
                                }
                              }, 100);
                            }}
                          >
                            <Icon className="!h-5 !w-5" />
                          </button>
                        )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky footer with actions */}
        {notifications.length > 0 && (
          <div className="shrink-0 border-t pt-4 pb-6 px-6 bg-background">
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex-1 h-10 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 dark:hover:border-blue-800 transition-colors"
                >
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissAll}
                className="flex-1 h-10 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear all
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
