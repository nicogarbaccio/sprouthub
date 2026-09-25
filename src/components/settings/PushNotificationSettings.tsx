import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsCard, SettingRow, FieldLabel, settingsInputClasses } from './SettingsUI';
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
    return <div className="h-40 rounded-card bg-card animate-pulse" aria-label="Loading push notification settings" />;
  }

  if (!isSupported) {
    return (
      <SettingsCard
        title="Push Notifications"
        description="Push notifications aren't supported on this device"
        icon={Smartphone}
      />
    );
  }

  const canUse = pushEnabled && permissionStatus === 'granted';

  return (
    <SettingsCard
      title="Push Notifications"
      description="Watering reminders even when the app is closed"
      icon={Smartphone}
      iconClasses="bg-sprout-water text-sprout-dark"
    >
      {/* Browser Permission Status */}
      <SettingRow
        label="Browser Permission"
        description="Controlled by your browser settings"
        control={
          permissionStatus === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-success text-sprout-dark">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Granted
            </span>
          ) : permissionStatus === 'denied' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-warning text-sprout-dark">
              <AlertCircle className="h-3.5 w-3.5" />
              Blocked
            </span>
          ) : (
            <button
              type="button"
              onClick={requestPermission}
              className="h-10 px-3.5 rounded-[14px] bg-sprout-cream text-sprout-dark text-sm font-bold"
            >
              Grant Permission
            </button>
          )
        }
      />

      {permissionStatus === 'denied' && (
        <div className="rounded-[18px] bg-sprout-warning/15 px-4 py-3.5 text-[13px] text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">How to unblock in your browser:</p>
          <p><strong>Chrome/Edge:</strong> lock icon → Site settings → Notifications → Allow</p>
          <p><strong>Firefox:</strong> shield icon → Permissions → Notifications → Allow</p>
          <p><strong>Safari:</strong> Safari menu → Settings → Websites → Notifications → Allow</p>
          <p className="italic">Then refresh this page.</p>
        </div>
      )}

      {/* App Settings Toggle */}
      <SettingRow
        htmlFor="push-enabled"
        label="App Notifications"
        description={
          permissionStatus === 'denied'
            ? 'Needs browser permission first'
            : permissionStatus === 'granted'
              ? pushEnabled
                ? "You'll get daily watering reminders"
                : 'Paused. Turn on to resume'
              : 'Turn reminders on or off'
        }
        className={cn(permissionStatus !== 'granted' && 'opacity-60')}
        control={
          <Switch
            id="push-enabled"
            checked={pushEnabled}
            onCheckedChange={handleEnablePush}
            disabled={permissionStatus !== 'granted'}
          />
        }
      />

      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2', !canUse && 'opacity-60')}>
        {/* Notification Time */}
        <div>
          <FieldLabel htmlFor="notification-time">Daily Reminder Time</FieldLabel>
          <Select value={notificationTime} onValueChange={handleTimeChange} disabled={!canUse}>
            <SelectTrigger id="notification-time" className={settingsInputClasses}>
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
        </div>

        {/* Timezone */}
        <div>
          <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
          <Select value={timezone} onValueChange={handleTimezoneChange} disabled={!canUse}>
            <SelectTrigger id="timezone" className={settingsInputClasses}>
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
        </div>
      </div>
    </SettingsCard>
  );
};
