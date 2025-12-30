import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { pushNotificationService } from '@/services/pushNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionState as CapacitorPermissionState } from '@capacitor/core';

export const PushNotificationSettings = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<CapacitorPermissionState>('prompt');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(pushNotificationService.isSupported());

    // Load user preferences from database
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('push_notifications_enabled, push_notification_time, push_notification_timezone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading push notification preferences:', error);
        } else if (data) {
          setPushEnabled(data.push_notifications_enabled ?? true);
          setNotificationTime(data.push_notification_time ?? '09:00:00');
          setTimezone(data.push_notification_timezone ?? 'America/New_York');
        }

        // Check current permission status
        const status = await pushNotificationService.getPermissionStatus();
        setPermissionStatus(status);
      } catch (error) {
        console.error('Error in loadPreferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleEnablePush = async (enabled: boolean) => {
    if (!user) return;

    try {
      // Update database preference
      const { error } = await supabase
        .from('profiles')
        .update({ push_notifications_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setPushEnabled(enabled);

      if (enabled) {
        // Initialize push notifications
        await pushNotificationService.enable();
        const status = await pushNotificationService.getPermissionStatus();
        setPermissionStatus(status);

        if (status === 'granted') {
          toast.success('Push notifications enabled');
        } else if (status === 'denied') {
          toast.error('Push notification permission denied. Please enable in system settings.');
        }
      } else {
        // Disable push notifications
        await pushNotificationService.disable();
        toast.success('Push notifications disabled');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to update push notification settings');
    }
  };

  const handleTimeChange = async (time: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_notification_time: time })
        .eq('id', user.id);

      if (error) throw error;

      setNotificationTime(time);
      toast.success('Notification time updated');
    } catch (error) {
      console.error('Error updating notification time:', error);
      toast.error('Failed to update notification time');
    }
  };

  const handleTimezoneChange = async (tz: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_notification_timezone: tz })
        .eq('id', user.id);

      if (error) throw error;

      setTimezone(tz);
      toast.success('Timezone updated');
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast.error('Failed to update timezone');
    }
  };

  const requestPermission = async () => {
    await pushNotificationService.initialize();
    const status = await pushNotificationService.getPermissionStatus();
    setPermissionStatus(status);

    if (status === 'granted') {
      toast.success('Push notification permission granted!');
    } else {
      toast.error('Push notification permission denied');
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading push notification settings...</div>;
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Push notifications are not supported on this device
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-500" />
          <CardTitle>Push Notifications</CardTitle>
        </div>
        <CardDescription>
          Receive watering reminders even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        {permissionStatus !== 'granted' && (
          <CascadingContainer delay={0}>
            <div className={`flex items-start gap-3 p-4 border rounded-lg ${
              permissionStatus === 'denied' ? 'bg-destructive/5 border-destructive/20' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900/30'
            }`}>
              <AlertCircle className={`h-5 w-5 mt-0.5 ${
                permissionStatus === 'denied' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500'
              }`} />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">
                  {permissionStatus === 'denied'
                    ? 'Push Notifications Blocked'
                    : 'Push Notifications Not Enabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {permissionStatus === 'denied'
                    ? 'You previously blocked notifications. To re-enable them, you need to update your browser settings:'
                    : 'Enable push notifications to receive daily watering reminders even when the app is closed.'}
                </p>
                {permissionStatus === 'denied' && (
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground bg-background/50 rounded p-3">
                    <p className="font-semibold text-foreground">How to re-enable notifications:</p>
                    <div className="space-y-1.5">
                      <p><strong>Chrome/Edge:</strong> Click the lock icon in the address bar → Site settings → Notifications → Allow</p>
                      <p><strong>Firefox:</strong> Click the shield icon → Permissions → Notifications → Allow</p>
                      <p><strong>Safari:</strong> Safari menu → Settings → Websites → Notifications → Allow for this site</p>
                      <p><strong>Mobile:</strong> Open device Settings → Apps → Browser → Notifications → Enable</p>
                    </div>
                    <p className="mt-2 text-xs italic">After changing settings, refresh this page.</p>
                  </div>
                )}
                {permissionStatus === 'prompt' && (
                  <Button onClick={requestPermission} size="sm" className="mt-2">
                    Enable Push Notifications
                  </Button>
                )}
              </div>
            </div>
          </CascadingContainer>
        )}

        {permissionStatus === 'granted' && (
          <CascadingContainer delay={0}>
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Push Notifications Enabled</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive daily reminders for plants that need watering
                </p>
              </div>
            </div>
          </CascadingContainer>
        )}

        <Separator />

        {/* Enable/Disable Toggle */}
        <CascadingContainer delay={50}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled" className="text-base font-medium">
                Enable Push Notifications
              </Label>
              <div className="text-sm text-muted-foreground">
                Receive daily watering reminders
              </div>
            </div>
            <Switch
              id="push-enabled"
              checked={pushEnabled}
              onCheckedChange={handleEnablePush}
              disabled={permissionStatus === 'denied'}
            />
          </div>
        </CascadingContainer>

        {/* Notification Time */}
        <CascadingContainer delay={100}>
          <div className="space-y-2">
            <Label htmlFor="notification-time">Daily Reminder Time</Label>
            <Select
              value={notificationTime}
              onValueChange={handleTimeChange}
              disabled={!pushEnabled}
            >
              <SelectTrigger id="notification-time">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00:00">6:00 AM</SelectItem>
                <SelectItem value="07:00:00">7:00 AM</SelectItem>
                <SelectItem value="08:00:00">8:00 AM</SelectItem>
                <SelectItem value="09:00:00">9:00 AM</SelectItem>
                <SelectItem value="10:00:00">10:00 AM</SelectItem>
                <SelectItem value="12:00:00">12:00 PM</SelectItem>
                <SelectItem value="14:00:00">2:00 PM</SelectItem>
                <SelectItem value="16:00:00">4:00 PM</SelectItem>
                <SelectItem value="18:00:00">6:00 PM</SelectItem>
                <SelectItem value="20:00:00">8:00 PM</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose when you'd like to receive your daily watering reminders
            </p>
          </div>
        </CascadingContainer>

        {/* Timezone */}
        <CascadingContainer delay={150}>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={timezone}
              onValueChange={handleTimezoneChange}
              disabled={!pushEnabled}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/Phoenix">Arizona (MST)</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your local timezone for accurate notification delivery
            </p>
          </div>
        </CascadingContainer>
      </CardContent>
    </Card>
  );
};
