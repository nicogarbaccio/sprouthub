import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
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
                      "p-4 rounded-lg border transition-colors",
                      !notification.read
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                        : "bg-background"
                    )}
                  >
                    {/* Content and action button */}
                    <div className="flex items-start justify-between gap-4">
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

                        {/* Timestamp, mark read, and dismiss */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="whitespace-nowrap">
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                          {!notification.read && (
                            <>
                              <span>•</span>
                              <button
                                className="hover:text-foreground transition-colors whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                Mark read
                              </button>
                            </>
                          )}
                          <span>•</span>
                          <button
                            className="hover:text-foreground transition-colors whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                          >
                            Clear
                          </button>
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
                  className="flex-1 h-10 hover:bg-muted"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={dismissAll}
                className="flex-1 h-10 hover:bg-muted"
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
