import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Droplets,
  AlertTriangle,
  Calendar,
  Cloud,
  Lightbulb,
  Users,
  Info,
  CheckCircle,
} from 'lucide-react';
import type { NotificationType, Notification } from '@/types/notificationTypes';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
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
  overdue_watering: 'text-red-500',
  due_today: 'text-orange-500',
  overwatering_risk: 'text-amber-500',
  seasonal_transition: 'text-blue-500',
  weather_alert: 'text-sky-500',
  pattern_insight: 'text-purple-500',
  household_invite: 'text-green-500',
  system: 'text-gray-500',
  success: 'text-green-500',
  info: 'text-blue-500',
};

const priorityBadgeColors = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-blue-500 text-white',
  low: 'bg-gray-500 text-white',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onOpenChange }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    getGroupedNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const displayedNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const groupedNotifications = getGroupedNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    // Execute action if available
    if (notification.actions && notification.actions.length > 0) {
      notification.actions[0].onClick();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissAll}
                  className="h-8"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
          <SheetDescription>
            Stay updated on your plants' needs and important alerts
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              All {notifications.length > 0 && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[calc(100vh-220px)]">
              {displayedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'unread'
                      ? "You're all caught up!"
                      : 'Notifications will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {displayedNotifications.map((notification) => {
                    const Icon = notification.icon || notificationIcons[notification.type];
                    const iconColor = notificationColors[notification.type];

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-3 rounded-lg border transition-colors cursor-pointer',
                          !notification.read
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                            : 'bg-background hover:bg-muted'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className={cn('mt-0.5', iconColor)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{notification.title}</h4>
                              {notification.priority !== 'low' && (
                                <Badge
                                  className={cn('h-5 text-xs', priorityBadgeColors[notification.priority])}
                                >
                                  {notification.priority}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </span>
                              <div className="flex gap-2">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {notification.actions.map((action, idx) => (
                                  <Button
                                    key={idx}
                                    variant={action.variant || 'default'}
                                    size="sm"
                                    className="h-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick();
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
