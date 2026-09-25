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

// Icon square colours, matching the tiles on Home: terracotta for overdue, water blue for
// watering, cream for tips and cautions, green for success
const notificationTones: Record<NotificationType, string> = {
  overdue_watering: "bg-sprout-warning text-sprout-dark",
  due_today: "bg-sprout-water text-sprout-dark",
  overwatering_risk: "bg-sprout-cream text-sprout-dark",
  seasonal_transition: "bg-sprout-primary text-sprout-cream",
  weather_alert: "bg-sprout-water text-sprout-dark",
  pattern_insight: "bg-sprout-cream text-sprout-dark",
  household_invite: "bg-sprout-primary text-sprout-cream",
  system: "bg-field text-foreground",
  success: "bg-sprout-success text-sprout-dark",
  info: "bg-field text-foreground",
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

  const chip =
    "inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-bold transition-colors";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md !p-0 !gap-0 flex flex-col overflow-hidden border-0 bg-background"
        closeClassName="right-5 top-5 w-11 h-11 rounded-2xl bg-card opacity-100 flex items-center justify-center [&>svg]:h-5 [&>svg]:w-5 data-[state=open]:bg-card"
      >
        <div className="px-5 pt-6 pb-4 pr-20 shrink-0">
          <SheetHeader className="p-0 text-left">
            <div className="flex items-center gap-2.5">
              <SheetTitle className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <span className="min-w-6 h-6 px-2 rounded-full bg-sprout-warning text-sprout-dark text-xs font-bold inline-flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {notifications.length === 0 ? (
            <div className="rounded-tile bg-card flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-field flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-display text-lg font-bold text-foreground">All quiet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Watering reminders and updates will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {notifications.map((notification) => {
                const Icon =
                  notification.icon || notificationIcons[notification.type];
                const action = notification.actions?.[0];

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-[22px] p-3.5 flex gap-3 transition-colors",
                      notification.read ? "bg-card/60" : "bg-card"
                    )}
                  >
                    {/* Icon square doubles as the primary action (e.g. open the plant to water it) */}
                    {action ? (
                      <button
                        type="button"
                        className={cn(
                          "w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform",
                          notificationTones[notification.type]
                        )}
                        aria-label={action.label || `Open ${notification.title}`}
                        onClick={(e) => {
                          e.stopPropagation();

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
                    ) : (
                      <div
                        className={cn(
                          "w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center",
                          notificationTones[notification.type]
                        )}
                      >
                        <Icon className="!h-5 !w-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4
                          className={cn(
                            "flex-1 text-[15px] leading-snug text-foreground",
                            notification.read ? "font-semibold" : "font-bold"
                          )}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span
                            className="mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full bg-sprout-warning"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mr-auto">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                        {!notification.read && (
                          <button
                            type="button"
                            className={cn(chip, "bg-field text-foreground hover:bg-sprout-cream hover:text-sprout-dark")}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Read
                          </button>
                        )}
                        <button
                          type="button"
                          className={cn(chip, "bg-field text-foreground hover:bg-sprout-warning hover:text-sprout-dark")}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                          Dismiss
                        </button>
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
          <div
            className="shrink-0 px-5 pt-3 bg-background"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
          >
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex-1 h-12 rounded-[18px] bg-card text-foreground font-bold text-sm inline-flex items-center justify-center gap-1.5 hover:bg-sprout-cream hover:text-sprout-dark transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={handleDismissAll}
                className="flex-1 h-12 rounded-[18px] bg-card text-foreground font-bold text-sm inline-flex items-center justify-center gap-1.5 hover:bg-sprout-warning hover:text-sprout-dark transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
