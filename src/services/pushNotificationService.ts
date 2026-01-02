/**
 * Push Notification Service
 *
 * Handles push notification registration, token management, and permissions
 * for iOS, Android, and Web platforms using Capacitor.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export type DeviceType = 'ios' | 'android' | 'web';

interface PushNotificationToken {
  token: string;
  device_type: DeviceType;
}

class PushNotificationService {
  private token: string | null = null;
  private isInitialized = false;

  /**
   * Initialize push notifications
   * Call this after user login
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    // Check if platform supports push notifications
    if (!Capacitor.isNativePlatform() && !('PushManager' in window)) {
      console.log('Push notifications not supported on this platform');
      return;
    }

    try {
      // Request permission
      const permissionResult = await PushNotifications.requestPermissions();

      if (permissionResult.receive === 'granted') {
        // Register with OS for push notifications
        await PushNotifications.register();

        // Set up listeners
        this.setupListeners();

        this.isInitialized = true;
        console.log('Push notifications initialized successfully');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Set up event listeners for push notifications
   */
  private setupListeners(): void {
    // On successful registration
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.token = token.value;
      await this.saveTokenToDatabase(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // When a notification is received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);

      // You can show a custom in-app notification here
      // For now, we'll let the OS handle it
    });

    // When user taps on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);

      // Handle notification tap - navigate to plants page
      const data = action.notification.data;

      if (data.type === 'overdue_watering' || data.type === 'due_today') {
        // Navigate to plants page
        window.location.href = '/my-plants';
      }
    });
  }

  /**
   * Save push token to database
   */
  private async saveTokenToDatabase(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user found, cannot save push token');
        return;
      }

      const deviceType = this.getDeviceType();
      const deviceName = this.getDeviceName();

      // Insert or update token in database
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token,
          device_type: deviceType,
          device_name: deviceName,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error in saveTokenToDatabase:', error);
    }
  }

  /**
   * Get current device type
   */
  private getDeviceType(): DeviceType {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
    return 'web';
  }

  /**
   * Get device name/identifier
   */
  private getDeviceName(): string {
    const platform = Capacitor.getPlatform();
    const userAgent = navigator.userAgent;

    if (platform === 'ios') {
      // Extract iOS device info from user agent if available
      const match = userAgent.match(/\(([^)]+)\)/);
      return match ? match[1] : 'iOS Device';
    }

    if (platform === 'android') {
      // Extract Android device info
      const match = userAgent.match(/\(([^)]+)\)/);
      return match ? match[1] : 'Android Device';
    }

    // Web browser
    return `Web (${navigator.platform})`;
  }

  /**
   * Disable push notifications and remove token
   */
  async disable(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Mark ALL tokens as inactive for this user (not just the current one)
      await supabase
        .from('push_notification_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // For web platforms, unsubscribe from push notifications
      if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            await subscription.unsubscribe();
            console.log('Push subscription unsubscribed');
          }
        } catch (error) {
          console.error('Error unsubscribing from push:', error);
        }
      }

      // Remove listeners
      await PushNotifications.removeAllListeners();

      this.token = null;
      this.isInitialized = false;

      console.log('Push notifications disabled');
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    }
  }

  /**
   * Re-enable push notifications
   */
  async enable(): Promise<void> {
    if (this.isInitialized) {
      // Already enabled
      return;
    }

    await this.initialize();
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return Capacitor.isNativePlatform() || ('PushManager' in window);
  }

  /**
   * Get current permission status
   */
  async getPermissionStatus() {
    try {
      // For web platforms, check the Notification API directly
      if (!Capacitor.isNativePlatform() && 'Notification' in window) {
        const permission = Notification.permission;

        // Map browser permissions to Capacitor permission states
        if (permission === 'granted') return 'granted';
        if (permission === 'denied') return 'denied';
        return 'prompt';
      }

      // For native platforms, use Capacitor's check
      const result = await PushNotifications.checkPermissions();
      return result.receive;
    } catch (error) {
      console.error('Error checking permission status:', error);

      // Fallback to browser Notification API if Capacitor fails
      if ('Notification' in window) {
        const permission = Notification.permission;
        if (permission === 'granted') return 'granted';
        if (permission === 'denied') return 'denied';
      }

      return 'prompt' as const;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
