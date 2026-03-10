import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  calendarSeasonalService,
  Season,
  UpcomingSeasonChange,
} from '@/services/calendarSeasonalService';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { safeJsonParse } from '@/utils/safeJsonParse';

const dismissalSchema = z.object({
  dismissed_at: z.string().optional(),
  snoozed_until: z.string().nullable().optional(),
});

const HOOK_NAME = 'useCalendarSeasonalNotification';

export interface PlantSeasonalSuggestion {
  plantId: string;
  plantNickname: string;
  plantType: string;
  isOutdoor: boolean;
  currentWateringDays: number;
  suggestedWateringDays: number;
  adjustmentDays: number;
  reasoning: string;
}

interface UseCalendarSeasonalNotificationReturn {
  upcomingChange: UpcomingSeasonChange | null;
  shouldShowNotification: boolean;
  plantSuggestions: PlantSeasonalSuggestion[];
  isLoading: boolean;
  error: string | null;
  dismissNotification: () => Promise<void>;
  snoozeNotification: (days: number) => Promise<void>;
  applyAllSuggestions: () => Promise<void>;
  applySuggestion: (plantId: string, days: number) => Promise<void>;
}

/**
 * Hook to manage calendar-based seasonal notifications
 *
 * This hook works independently of weather data and provides seasonal
 * change notifications based purely on calendar dates.
 */
export function useCalendarSeasonalNotification(
  latitude: number = 0 // Default to Northern Hemisphere
): UseCalendarSeasonalNotificationReturn {
  const { user } = useAuth();

  const [upcomingChange, setUpcomingChange] = useState<UpcomingSeasonChange | null>(null);
  const [shouldShowNotification, setShouldShowNotification] = useState(false);
  const [plants, setPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user has dismissed this season's notification
   * Uses the database table for cross-device sync, with localStorage as fallback
   */
  const checkDismissalStatus = useCallback(
    async (season: Season, year: number): Promise<boolean> => {
      if (!user) return false;

      const tracker = trackOperation(HOOK_NAME, 'checkDismissalStatus');

      try {
        // Try database first for cross-device sync
        // Note: calendar_seasonal_notifications table may not exist in all environments
        const { data: rawData, error } = await supabase
          .from('calendar_seasonal_notifications' as any)
          .select('dismissed_at, snoozed_until')
          .eq('user_id', user.id)
          .eq('season', season)
          .eq('year', year)
          .maybeSingle();

        const data = rawData as { dismissed_at?: string | null; snoozed_until?: string | null } | null;

        if (!error && data) {
          // Check if snoozed
          if (data.snoozed_until) {
            const snoozeDate = new Date(data.snoozed_until);
            const isStillSnoozed = snoozeDate > new Date();

            if (!isStillSnoozed) {
              // Snooze period ended, remove the record
              await supabase
                .from('calendar_seasonal_notifications' as any)
                .delete()
                .eq('user_id', user.id)
                .eq('season', season)
                .eq('year', year);
            }

            tracker.complete({ dismissed: true, snoozed: isStillSnoozed, source: 'db' });
            return isStillSnoozed;
          }

          if (data.dismissed_at) {
            tracker.complete({ dismissed: true, snoozed: false, source: 'db' });
            return true;
          }
        }

        // Fall back to localStorage for backwards compatibility
        const storageKey = `calendar_seasonal_dismissal_${user.id}_${season}_${year}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const localData = safeJsonParse(stored, dismissalSchema, null);
          if (!localData) return false;

          if (localData.snoozed_until) {
            const snoozeDate = new Date(localData.snoozed_until);
            const isStillSnoozed = snoozeDate > new Date();

            if (!isStillSnoozed) {
              localStorage.removeItem(storageKey);
            }

            tracker.complete({ dismissed: true, snoozed: isStillSnoozed, source: 'localStorage' });
            return isStillSnoozed;
          }

          tracker.complete({ dismissed: true, snoozed: false, source: 'localStorage' });
          return true;
        }

        tracker.complete({ dismissed: false });
        return false;
      } catch (err) {
        tracker.fail(err);
        hookLogger.error(HOOK_NAME, 'Error checking dismissal status', err);
        return false;
      }
    },
    [user]
  );

  /**
   * Load user's plants
   */
  const loadPlants = useCallback(async () => {
    if (!user) return;

    const tracker = trackOperation(HOOK_NAME, 'loadPlants');

    try {
      const { data, error } = await supabase
        .from('user_plants')
        .select('id, nickname, plant_type, is_outdoor_plant, suggested_watering_days')
        .eq('user_id', user.id);

      if (error) throw error;

      setPlants(data || []);
      tracker.complete({ plantCount: data?.length || 0 });
    } catch (err) {
      tracker.fail(err);
      hookLogger.error(HOOK_NAME, 'Error loading plants', err);
      setError('Failed to load plants');
    }
  }, [user]);

  /**
   * Check for upcoming season change
   */
  const checkSeasonChange = useCallback(async () => {
    if (!user) return;

    const tracker = trackOperation(HOOK_NAME, 'checkSeasonChange');

    try {
      setIsLoading(true);
      setError(null);

      // Check for upcoming season change
      const change = calendarSeasonalService.checkUpcomingSeasonChange(latitude);

      if (change && change.shouldNotify) {
        // Check if user has already dismissed this notification
        const isDismissed = await checkDismissalStatus(
          change.nextSeason,
          change.changeDate.getFullYear()
        );

        if (!isDismissed) {
          setUpcomingChange(change);
          setShouldShowNotification(true);

          // Load plants for suggestions
          await loadPlants();

          tracker.complete({ change, shouldShow: true });
          return;
        }
      }

      setUpcomingChange(change);
      setShouldShowNotification(false);
      tracker.complete({ change, shouldShow: false });
    } catch (err) {
      tracker.fail(err);
      hookLogger.error(HOOK_NAME, 'Error checking season change', err);
      setError('Failed to check seasonal changes');
    } finally {
      setIsLoading(false);
    }
  }, [user, latitude, checkDismissalStatus, loadPlants]);

  /**
   * Generate suggestions for all plants
   */
  const plantSuggestions = useMemo((): PlantSeasonalSuggestion[] => {
    if (!upcomingChange || plants.length === 0) return [];

    return plants
      .map((plant) => {
        const currentDays = plant.suggested_watering_days || 7;
        const adjustment = calendarSeasonalService.getSeasonalAdjustment(
          currentDays,
          upcomingChange.nextSeason,
          plant.plant_type || 'Unknown',
          plant.is_outdoor_plant || false
        );

        const suggestedDays = currentDays + adjustment.adjustmentDays;

        // Only include plants that need adjustment
        if (adjustment.adjustmentDays === 0) return null;

        return {
          plantId: plant.id,
          plantNickname: plant.nickname,
          plantType: plant.plant_type,
          isOutdoor: plant.is_outdoor_plant || false,
          currentWateringDays: currentDays,
          suggestedWateringDays: suggestedDays,
          adjustmentDays: adjustment.adjustmentDays,
          reasoning: adjustment.reasoning,
        };
      })
      .filter((suggestion): suggestion is PlantSeasonalSuggestion => suggestion !== null);
  }, [upcomingChange, plants]);

  /**
   * Dismiss the notification for this season
   * Writes to database for cross-device sync, with localStorage as backup
   */
  const dismissNotification = useCallback(async () => {
    if (!user || !upcomingChange) return;

    const tracker = trackOperation(HOOK_NAME, 'dismissNotification');

    try {
      const season = upcomingChange.nextSeason;
      const year = upcomingChange.changeDate.getFullYear();

      // Write to database for cross-device sync
      const { error } = await supabase
        .from('calendar_seasonal_notifications' as any)
        .upsert(
          {
            user_id: user.id,
            season,
            year,
            dismissed_at: new Date().toISOString(),
            snoozed_until: null,
          },
          { onConflict: 'user_id,season,year' }
        );

      if (error) {
        hookLogger.warn(HOOK_NAME, 'DB write failed, falling back to localStorage', error);
      }

      // Also write to localStorage as backup
      const storageKey = `calendar_seasonal_dismissal_${user.id}_${season}_${year}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          dismissed_at: new Date().toISOString(),
          snoozed_until: null,
        })
      );

      setShouldShowNotification(false);
      tracker.complete({ season });
    } catch (err) {
      tracker.fail(err);
      hookLogger.error(HOOK_NAME, 'Error dismissing notification', err);
      throw err;
    }
  }, [user, upcomingChange]);

  /**
   * Snooze the notification for a specified number of days
   * Writes to database for cross-device sync, with localStorage as backup
   */
  const snoozeNotification = useCallback(
    async (days: number) => {
      if (!user || !upcomingChange) return;

      const tracker = trackOperation(HOOK_NAME, 'snoozeNotification');

      try {
        const snoozeUntil = new Date();
        snoozeUntil.setDate(snoozeUntil.getDate() + days);

        const season = upcomingChange.nextSeason;
        const year = upcomingChange.changeDate.getFullYear();

        // Write to database for cross-device sync
        const { error } = await supabase
          .from('calendar_seasonal_notifications' as any)
          .upsert(
            {
              user_id: user.id,
              season,
              year,
              snoozed_until: snoozeUntil.toISOString(),
            },
            { onConflict: 'user_id,season,year' }
          );

        if (error) {
          hookLogger.warn(HOOK_NAME, 'DB write failed, falling back to localStorage', error);
        }

        // Also write to localStorage as backup
        const storageKey = `calendar_seasonal_dismissal_${user.id}_${season}_${year}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            snoozed_until: snoozeUntil.toISOString(),
          })
        );

        setShouldShowNotification(false);
        tracker.complete({ days, snoozeUntil });
      } catch (err) {
        tracker.fail(err);
        hookLogger.error(HOOK_NAME, 'Error snoozing notification', err);
        throw err;
      }
    },
    [user, upcomingChange]
  );

  /**
   * Apply a single suggestion
   */
  const applySuggestion = useCallback(
    async (plantId: string, days: number) => {
      const tracker = trackOperation(HOOK_NAME, 'applySuggestion');

      try {
        const { error } = await supabase
          .from('user_plants')
          .update({
            suggested_watering_days: days,
            last_schedule_review: new Date().toISOString(),
          })
          .eq('id', plantId);

        if (error) throw error;

        // Reload plants to update suggestions
        await loadPlants();

        tracker.complete({ plantId, days });
      } catch (err) {
        tracker.fail(err);
        hookLogger.error(HOOK_NAME, 'Error applying suggestion', err);
        throw err;
      }
    },
    [loadPlants]
  );

  /**
   * Apply all suggestions at once
   */
  const applyAllSuggestions = useCallback(async () => {
    const tracker = trackOperation(HOOK_NAME, 'applyAllSuggestions');

    try {
      setIsLoading(true);

      for (const suggestion of plantSuggestions) {
        await applySuggestion(suggestion.plantId, suggestion.suggestedWateringDays);
      }

      // Dismiss the notification after applying all
      await dismissNotification();

      tracker.complete({ count: plantSuggestions.length });
    } catch (err) {
      tracker.fail(err);
      hookLogger.error(HOOK_NAME, 'Error applying all suggestions', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [plantSuggestions, applySuggestion, dismissNotification]);

  /**
   * Check for season changes on mount and daily
   */
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkSeasonChange();

    // Check once per day
    const interval = setInterval(
      () => {
        checkSeasonChange();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours

    return () => clearInterval(interval);
  }, [user, checkSeasonChange]);

  return {
    upcomingChange,
    shouldShowNotification,
    plantSuggestions,
    isLoading,
    error,
    dismissNotification,
    snoozeNotification,
    applyAllSuggestions,
    applySuggestion,
  };
}
