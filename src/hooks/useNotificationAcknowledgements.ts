import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';

const HOOK_NAME = 'useNotificationAcknowledgements';

interface Acknowledgement {
  notification_type: string;
  plant_id: string;
}

/**
 * Hook that manages notification acknowledgements in Supabase,
 * syncing dismissed/acknowledged state across devices.
 *
 * Replaces the per-device localStorage acknowledgement tracking
 * previously used in usePlantNotifications.
 */
export function useNotificationAcknowledgements() {
  const { user } = useAuth();
  const acknowledgementsRef = useRef<Acknowledgement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const todayRef = useRef<string>(new Date().toISOString().split('T')[0]);

  // Fetch today's acknowledgements from the database on mount
  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    const tracker = trackOperation(HOOK_NAME, 'fetchAcknowledgements');

    const fetchAcks = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        todayRef.current = today;

        const { data, error } = await supabase
          .from('notification_acknowledgements')
          .select('notification_type, plant_id')
          .eq('user_id', user.id);

        if (error) throw error;

        acknowledgementsRef.current = (data || []).map((row) => ({
          notification_type: row.notification_type,
          plant_id: row.plant_id,
        }));

        tracker.complete({ count: data?.length || 0 });
      } catch (err) {
        hookLogger.error(HOOK_NAME, 'Error fetching acknowledgements', err);
        tracker.fail(err);
        // Fall back to empty — notifications will appear (better than hiding them)
        acknowledgementsRef.current = [];
      } finally {
        setIsLoaded(true);
      }
    };

    fetchAcks();
  }, [user]);

  /**
   * Check if a specific plant notification has been acknowledged today
   */
  const isAcknowledged = useCallback(
    (notificationType: string, plantId: string): boolean => {
      return acknowledgementsRef.current.some(
        (ack) =>
          ack.notification_type === notificationType &&
          ack.plant_id === plantId
      );
    },
    []
  );

  /**
   * Get all acknowledged plant IDs for a notification type today
   */
  const getAcknowledgedIds = useCallback(
    (notificationType: string): string[] => {
      return acknowledgementsRef.current
        .filter((ack) => ack.notification_type === notificationType)
        .map((ack) => ack.plant_id);
    },
    []
  );

  /**
   * Acknowledge a notification — writes to DB and updates local cache
   */
  const acknowledge = useCallback(
    async (notificationType: string, plantId: string) => {
      // Update local cache immediately for responsive UI
      if (!isAcknowledged(notificationType, plantId)) {
        acknowledgementsRef.current = [
          ...acknowledgementsRef.current,
          { notification_type: notificationType, plant_id: plantId },
        ];
      }

      if (!user) return;

      const tracker = trackOperation(HOOK_NAME, 'acknowledge');

      try {
        const { error } = await supabase
          .from('notification_acknowledgements')
          .upsert(
            {
              user_id: user.id,
              notification_type: notificationType,
              plant_id: plantId,
              acknowledged_date: todayRef.current,
            },
            { onConflict: 'user_id,notification_type,plant_id,acknowledged_date' }
          );

        if (error) throw error;

        tracker.complete({ notificationType, plantId });
      } catch (err) {
        hookLogger.error(HOOK_NAME, 'Error persisting acknowledgement', err);
        tracker.fail(err);
        // Local cache was already updated, so UI stays consistent
        // DB will catch up on next page load
      }
    },
    [user, isAcknowledged]
  );

  /**
   * Acknowledge multiple notifications at once (for "dismiss all")
   */
  const acknowledgeBatch = useCallback(
    async (items: Array<{ notificationType: string; plantId: string }>) => {
      if (items.length === 0) return;

      // Update local cache immediately
      for (const item of items) {
        if (!isAcknowledged(item.notificationType, item.plantId)) {
          acknowledgementsRef.current = [
            ...acknowledgementsRef.current,
            {
              notification_type: item.notificationType,
              plant_id: item.plantId,
            },
          ];
        }
      }

      if (!user) return;

      const tracker = trackOperation(HOOK_NAME, 'acknowledgeBatch');

      try {
        const rows = items.map((item) => ({
          user_id: user.id,
          notification_type: item.notificationType,
          plant_id: item.plantId,
          acknowledged_date: todayRef.current,
        }));

        const { error } = await supabase
          .from('notification_acknowledgements')
          .upsert(rows, {
            onConflict: 'user_id,notification_type,plant_id,acknowledged_date',
          });

        if (error) throw error;

        tracker.complete({ count: items.length });
      } catch (err) {
        hookLogger.error(HOOK_NAME, 'Error persisting batch acknowledgements', err);
        tracker.fail(err);
      }
    },
    [user, isAcknowledged]
  );

  return {
    isLoaded,
    isAcknowledged,
    getAcknowledgedIds,
    acknowledge,
    acknowledgeBatch,
  };
}
