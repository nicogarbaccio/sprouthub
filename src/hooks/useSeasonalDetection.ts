import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { seasonalDetectionService, Season, SeasonalTransition } from '@/services/seasonalDetectionService';
import { useWeatherData } from './useWeatherData';
import { useLocation } from './useLocation';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { getErrorMessage } from '@/utils/errorHandling';

const HOOK_NAME = 'useSeasonalDetection';

interface UseSeasonalDetectionReturn {
  currentSeason: Season | null;
  pendingTransition: SeasonalTransition | null;
  shouldShowReview: boolean;
  isLoading: boolean;
  error: string | null;
  triggerReview: () => void;
  dismissReview: () => void;
  snoozeReview: (weeks: number) => void;
  checkForTransition: () => Promise<void>;
}

export function useSeasonalDetection(): UseSeasonalDetectionReturn {
  const { user } = useAuth();
  const { weatherData, isLoading: weatherLoading } = useWeatherData();
  const { location } = useLocation();

  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [pendingTransition, setPendingTransition] = useState<SeasonalTransition | null>(null);
  const [shouldShowReview, setShouldShowReview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref for lastCheckDate to avoid dependency issues
  const lastCheckDateRef = useRef<Date | null>(null);

  /**
   * Initialize current season when location is available
   */
  useEffect(() => {
    if (location) {
      hookLogger.debug(HOOK_NAME, 'Initializing current season', { location });
      const season = seasonalDetectionService.getCurrentSeason(location);
      setCurrentSeason(season);
      hookLogger.debug(HOOK_NAME, 'Current season set', { season });
    }
  }, [location]);

  /**
   * Store weather data for historical analysis
   */
  useEffect(() => {
    if (weatherData) {
      hookLogger.debug(HOOK_NAME, 'Storing weather data', {
        hasData: !!weatherData
      });
      seasonalDetectionService.storeWeatherData(weatherData);
    }
  }, [weatherData]);

  /**
   * Check if user has already been notified about this season transition
   */
  const checkNotificationHistory = useCallback(async (
    userId: string,
    season: Season,
    year: number
  ): Promise<boolean> => {
    const tracker = trackOperation(HOOK_NAME, 'checkNotificationHistory');

    try {
      const { data, error } = await supabase
        .from('seasonal_review_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('season', season)
        .eq('year', year)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

      const hasBeenNotified = !!data;
      tracker.complete({ hasBeenNotified });
      return hasBeenNotified;
    } catch (error) {
      tracker.fail(error);
      hookLogger.error(HOOK_NAME, 'Error checking notification history', error);
      // Default to TRUE (has been notified) to prevent spamming the user if DB check fails
      return true;
    }
  }, []);

  /**
   * Record notification in database
   */
  const recordNotification = useCallback(async (
    responseType: 'applied' | 'dismissed' | 'snoozed' | 'customized'
  ) => {
    if (!user || !pendingTransition) return;

    const tracker = trackOperation(HOOK_NAME, 'recordNotification');

    try {
      const { error } = await supabase
        .from('seasonal_review_notifications')
        .upsert({
          user_id: user.id,
          season: pendingTransition.to_season,
          year: new Date().getFullYear(),
          response_type: responseType,
          user_responded_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,season,year'
        });

      if (error) throw error;

      tracker.complete({ responseType });
    } catch (error) {
      tracker.fail(error);
      hookLogger.error(HOOK_NAME, 'Error recording notification', error);
    }
  }, [user, pendingTransition]);

  /**
   * Check for seasonal transitions
   */
  const checkForTransition = useCallback(async () => {
    if (!location || !currentSeason || !user || weatherLoading) {
      hookLogger.debug(HOOK_NAME, 'Skipping transition check - missing requirements', {
        hasLocation: !!location,
        hasSeason: !!currentSeason,
        hasUser: !!user,
        weatherLoading
      });
      return;
    }

    const tracker = trackOperation(HOOK_NAME, 'checkForTransition');

    try {
      setIsLoading(true);
      setError(null);

      // Don't check more than once per day
      const today = new Date().toDateString();
      if (lastCheckDateRef.current && lastCheckDateRef.current.toDateString() === today) {
        hookLogger.debug(HOOK_NAME, 'Already checked today, skipping');
        tracker.complete({ skipped: true });
        return;
      }

      hookLogger.debug(HOOK_NAME, 'Checking for seasonal transition', {
        currentSeason,
        location
      });

      const transition = await seasonalDetectionService.detectSeasonalTransition(
        currentSeason,
        location
      );

      if (transition) {
        // Check if transition is stable (2+ weeks old)
        if (seasonalDetectionService.isTransitionStable(transition.transition_date)) {
          setPendingTransition(transition);

          // Check if user hasn't been notified about this transition yet
          const hasBeenNotified = await checkNotificationHistory(
            user.id,
            transition.to_season,
            new Date().getFullYear()
          );

          if (!hasBeenNotified) {
            hookLogger.debug(HOOK_NAME, 'New seasonal transition detected', {
              from: transition.from_season,
              to: transition.to_season
            });
            setShouldShowReview(true);
          } else {
            hookLogger.debug(HOOK_NAME, 'User already notified about this transition');
          }
        } else {
          hookLogger.debug(HOOK_NAME, 'Transition not yet stable');
        }
      } else {
        hookLogger.debug(HOOK_NAME, 'No transition detected');
      }

      lastCheckDateRef.current = new Date();
      tracker.complete({ transitionDetected: !!transition });
    } catch (err) {
      tracker.fail(err);
      hookLogger.error(HOOK_NAME, 'Error checking for seasonal transition', err);

      const errorMsg = getErrorMessage(err, 'Unknown error occurred');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [location, currentSeason, user, weatherLoading, checkNotificationHistory]);

  /**
   * Trigger manual review
   */
  const triggerReview = useCallback(() => {
    hookLogger.debug(HOOK_NAME, 'Manually triggering review');
    setShouldShowReview(true);
  }, []);

  /**
   * Dismiss review notification
   */
  const dismissReview = useCallback(async () => {
    hookLogger.debug(HOOK_NAME, 'Dismissing review');
    setShouldShowReview(false);
    await recordNotification('dismissed');
  }, [recordNotification]);

  /**
   * Snooze review for specified number of weeks
   */
  const snoozeReview = useCallback(async (weeks: number) => {
    hookLogger.debug(HOOK_NAME, 'Snoozing review', { weeks });
    setShouldShowReview(false);
    await recordNotification('snoozed');

    // Set a timeout to show review again after the snooze period
    setTimeout(() => {
      hookLogger.debug(HOOK_NAME, 'Snooze period ended, showing review again');
      setShouldShowReview(true);
    }, weeks * 7 * 24 * 60 * 60 * 1000); // Convert weeks to milliseconds
  }, [recordNotification]);

  /**
   * Automatic daily check for transitions
   */
  useEffect(() => {
    // Check immediately if conditions are met
    if (location && currentSeason && user && !weatherLoading) {
      hookLogger.debug(HOOK_NAME, 'Running initial transition check');
      checkForTransition();
    }

    // Set up daily check
    hookLogger.debug(HOOK_NAME, 'Setting up daily transition check interval');
    const interval = setInterval(() => {
      hookLogger.debug(HOOK_NAME, 'Running scheduled daily transition check');
      checkForTransition();
    }, 24 * 60 * 60 * 1000); // Check once per day

    return () => {
      hookLogger.debug(HOOK_NAME, 'Clearing daily transition check interval');
      clearInterval(interval);
    };
  }, [location, currentSeason, user, weatherLoading, checkForTransition]);

  return {
    currentSeason,
    pendingTransition,
    shouldShowReview,
    isLoading,
    error,
    triggerReview,
    dismissReview,
    snoozeReview,
    checkForTransition
  };
}
