import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { seasonalDetectionService, Season, SeasonalTransition } from '@/services/seasonalDetectionService';
import { weatherService } from '@/services/weatherService';
import { useWeatherData } from './useWeatherData';
import { useLocation } from './useLocation';
import { supabase } from '@/integrations/supabase/client';

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
  const [lastCheckDate, setLastCheckDate] = useState<Date | null>(null);

  /**
   * Initialize current season when location is available
   */
  useEffect(() => {
    if (location) {
      const season = seasonalDetectionService.getCurrentSeason(location);
      setCurrentSeason(season);
    }
  }, [location]);

  /**
   * Store weather data for historical analysis
   */
  useEffect(() => {
    if (weatherData) {
      seasonalDetectionService.storeWeatherData(weatherData);
    }
  }, [weatherData]);

  /**
   * Check for seasonal transitions
   */
  const checkForTransition = useCallback(async () => {
    if (!location || !currentSeason || !user || weatherLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // Don't check more than once per day
      const today = new Date().toDateString();
      if (lastCheckDate && lastCheckDate.toDateString() === today) {
        return;
      }

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
            setShouldShowReview(true);
          }
        }
      }

      setLastCheckDate(new Date());
    } catch (err) {
      console.error('Error checking for seasonal transition:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [location, currentSeason, user, weatherLoading, lastCheckDate]);

  /**
   * Check if user has already been notified about this season transition
   */
  const checkNotificationHistory = async (
    userId: string,
    season: Season,
    year: number
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('seasonal_review_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('season', season)
        .eq('year', year)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return !!data;
    } catch (error) {
      console.error('Error checking notification history:', error);
      return false;
    }
  };

  /**
   * Record notification in database
   */
  const recordNotification = async (
    responseType: 'applied' | 'dismissed' | 'snoozed' | 'customized'
  ) => {
    if (!user || !pendingTransition) return;

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
    } catch (error) {
      console.error('Error recording notification:', error);
    }
  };

  /**
   * Trigger manual review
   */
  const triggerReview = useCallback(() => {
    setShouldShowReview(true);
  }, []);

  /**
   * Dismiss review notification
   */
  const dismissReview = useCallback(async () => {
    setShouldShowReview(false);
    await recordNotification('dismissed');
  }, []);

  /**
   * Snooze review for specified number of weeks
   */
  const snoozeReview = useCallback(async (weeks: number) => {
    setShouldShowReview(false);
    await recordNotification('snoozed');
    
    // Set a timeout to show review again after the snooze period
    setTimeout(() => {
      setShouldShowReview(true);
    }, weeks * 7 * 24 * 60 * 60 * 1000); // Convert weeks to milliseconds
  }, []);

  /**
   * Automatic daily check for transitions
   */
  useEffect(() => {
    // Check immediately if conditions are met
    if (location && currentSeason && user && !weatherLoading) {
      checkForTransition();
    }

    // Set up daily check
    const interval = setInterval(() => {
      checkForTransition();
    }, 24 * 60 * 60 * 1000); // Check once per day

    return () => clearInterval(interval);
  }, [checkForTransition]);

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
