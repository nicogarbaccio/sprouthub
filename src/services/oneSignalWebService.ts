/**
 * OneSignal Web Push Notification Service
 *
 * This service uses OneSignal's Web SDK for browser-based push notifications.
 * Use this for testing in development or for PWA deployment.
 */

import { supabase } from '@/integrations/supabase/client';

// OneSignal Web SDK types — SDK is loaded externally via script tag
interface OneSignalSDK {
  push: (callback: () => void) => void;
  init: (config: Record<string, unknown>) => Promise<void>;
  context?: { appConfig?: { appId?: string } };
  Notifications: { permission: boolean | string; requestPermission: () => Promise<boolean> };
  User: { PushSubscription: { id: string | null; optOut: () => Promise<void> } };
}

declare global {
  interface Window {
    OneSignalDeferred?: Promise<unknown>;
    OneSignal?: OneSignalSDK;
  }
}

class OneSignalWebService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize OneSignal Web Push
   * Call this after user login
   */
  async initialize(): Promise<void> {
    // Check if OneSignal is already initialized by checking window object
    if (window.OneSignal?.context?.appConfig?.appId) {
      console.log('[OneSignal] Already initialized with App ID:', window.OneSignal.context.appConfig.appId);
      this.isInitialized = true;
      return;
    }

    if (this.isInitialized) {
      console.log('[OneSignal] Already initialized (flag)');
      return;
    }

    // If already initializing, wait for that to complete
    if (this.initPromise) {
      console.log('[OneSignal] Initialization in progress, waiting...');
      return this.initPromise;
    }

    // Check if in browser environment
    if (typeof window === 'undefined') {
      console.log('[OneSignal] Not in browser environment');
      return;
    }

    // Create initialization promise
    this.initPromise = (async () => {
      try {
        // Get OneSignal App ID from environment
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

        if (!appId) {
          console.error('[OneSignal] App ID not found in environment variables');
          console.error('[OneSignal] Make sure VITE_ONESIGNAL_APP_ID is set in .env.local');
          return;
        }

        console.log('[OneSignal] Initializing OneSignal Web Push...');
        console.log('[OneSignal] App ID:', appId);

      // Wait for OneSignal SDK to be available (loaded via script tag in head)
      await this.waitForOneSignalSDK();

      // Initialize OneSignal with App ID
      if (!window.OneSignal) {
        console.error('[OneSignal] SDK not available after waiting');
        return;
      }

      await new Promise<void>((resolve) => {
        window.OneSignal!.push(async () => {
          try {
            // Check if already initialized (has appId set)
            const currentAppId = window.OneSignal.context?.appConfig?.appId;

            if (currentAppId) {
              console.log('[OneSignal] Already initialized with App ID:', currentAppId);
              // Already initialized, skip init but continue with permission check
            } else {
              console.log('[OneSignal] Calling OneSignal.init...');

              try {
                await window.OneSignal.init({
                  appId: appId,
                  allowLocalhostAsSecureOrigin: true, // For development
                  serviceWorkerParam: { scope: '/' },
                  serviceWorkerPath: '/OneSignalSDKWorker.js',
                  notifyButton: {
                    enable: false, // We'll use custom UI
                  },
                });

                console.log('[OneSignal] ✅ Initialized successfully!');
              } catch (initError: unknown) {
                // Check if it's a domain restriction error
                if (initError instanceof Error && initError.message?.includes('Can only be used on')) {
                  console.warn('[OneSignal] ⚠️ Domain restriction - OneSignal is configured for production only');
                  console.warn('[OneSignal] This is expected in local development. Push notifications will not work.');
                  // Don't throw - just log and continue
                  resolve();
                  return;
                } else {
                  // Re-throw other errors
                  throw initError;
                }
              }
            }

            // Check permission status
            const permission = await window.OneSignal.Notifications.permission;
            console.log('[OneSignal] Permission status:', permission);

            // Permission can be either boolean or string
            const isGranted = permission === true || permission === 'granted';
            const isDefault = permission === 'default';

            if (isGranted) {
              console.log('[OneSignal] Permission already granted, registering device...');
              await this.registerDevice();
            } else if (isDefault) {
              console.log('[OneSignal] Requesting permission...');
              const result = await window.OneSignal.Notifications.requestPermission();

              if (result) {
                console.log('[OneSignal] ✅ Permission granted!');
                await this.registerDevice();

                // Trigger immediate in-app notification check
                console.log('[OneSignal] Triggering immediate notification check...');
                window.dispatchEvent(new CustomEvent('push-permission-granted'));
              } else {
                console.log('[OneSignal] ❌ Permission denied by user');
              }
            } else {
              console.log('[OneSignal] ❌ Permission previously denied');
            }

            this.isInitialized = true;
            resolve();

          } catch (error: unknown) {
            // If it's a domain restriction error, log it but don't crash
            if (error instanceof Error && error.message?.includes('Can only be used on')) {
              console.warn('[OneSignal] ⚠️ Skipping OneSignal due to domain restriction');
            } else {
              console.error('[OneSignal] Error in init callback:', error);
            }
            resolve(); // Resolve anyway to prevent hanging
          }
        });
      });

      } catch (error) {
        console.error('[OneSignal] Error initializing:', error);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Wait for OneSignal SDK to be available
   * SDK is loaded via script tag in index.html
   */
  private async waitForOneSignalSDK(): Promise<void> {
    console.log('[OneSignal] Waiting for SDK...');

    const maxAttempts = 50; // 5 seconds max
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Check if OneSignal is available and fully loaded
      if (window.OneSignal && typeof window.OneSignal.push === 'function') {
        console.log('[OneSignal] ✅ SDK ready!');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    console.error('[OneSignal] ❌ SDK not available after 5 seconds');
    throw new Error('OneSignal SDK failed to load');
  }

  /**
   * Register device and save token to Supabase
   */
  private async registerDevice(): Promise<void> {
    try {
      console.log('[OneSignal] Registering device...');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('[OneSignal] ❌ No user found, cannot register device');
        return;
      }

      console.log('[OneSignal] User ID:', user.id);

      // Get OneSignal player ID (this is the device token)
      const playerId = await window.OneSignal.User.PushSubscription.id;

      if (!playerId) {
        console.error('[OneSignal] ❌ No Player ID found');
        console.error('[OneSignal] User might not be subscribed yet');
        return;
      }

      console.log('[OneSignal] ✅ Player ID:', playerId);

      // Save to database
      console.log('[OneSignal] Saving token to database...');
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token: playerId,
          device_type: 'web',
          device_name: `Web (${navigator.platform})`,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        console.error('[OneSignal] ❌ Error saving push token:', error);
      } else {
        console.log('[OneSignal] ✅✅✅ Push token saved to database successfully!');
        console.log('[OneSignal] You should now appear in OneSignal dashboard!');
      }
    } catch (error) {
      console.error('[OneSignal] ❌ Error in registerDevice:', error);
    }
  }

  /**
   * Disable push notifications
   */
  async disable(): Promise<void> {
    try {
      console.log('[OneSignal] Disabling push notifications...');

      if (!window.OneSignal) {
        console.log('[OneSignal] OneSignal not loaded, skipping disable');
        return;
      }

      await window.OneSignal.User.PushSubscription.optOut();

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const playerId = await window.OneSignal.User.PushSubscription.id;

        if (playerId) {
          await supabase
            .from('push_notification_tokens')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('token', playerId);
        }
      }

      this.isInitialized = false;
      console.log('[OneSignal] ✅ Push notifications disabled');
    } catch (error) {
      console.error('[OneSignal] Error disabling push notifications:', error);
    }
  }

  /**
   * Check permission status
   */
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'default'> {
    try {
      if (!window.OneSignal) {
        return 'denied';
      }

      const permission = await window.OneSignal.Notifications.permission;
      return permission as 'granted' | 'denied' | 'default';
    } catch {
      return 'denied';
    }
  }

  /**
   * Check if OneSignal is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

// Export singleton instance
export const oneSignalWebService = new OneSignalWebService();
