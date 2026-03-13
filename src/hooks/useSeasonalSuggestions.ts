import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleVersioningService, SeasonalScheduleSuggestion } from '@/services/scheduleVersioningService';
import { Season } from '@/services/seasonalDetectionService';
import { WeatherData } from '@/services/weatherTypes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger } from '@/utils/hookLogging';

const HOOK_NAME = 'useSeasonalSuggestions';

interface UseSeasonalSuggestionsProps {
  newSeason: Season | null;
  weatherConditions: WeatherData | null;
  enabled?: boolean;
}

interface UseSeasonalSuggestionsReturn {
  suggestions: SeasonalScheduleSuggestion[];
  isLoading: boolean;
  error: string | null;
  applySuggestion: (plantId: string, days: number) => Promise<void>;
  applyAllSuggestions: () => Promise<void>;
  customizeSchedule: (plantId: string, days: number) => Promise<void>;
  refreshSuggestions: () => Promise<void>;
  hasUnappliedSuggestions: boolean;
}

export function useSeasonalSuggestions({
  newSeason,
  weatherConditions,
  enabled = true
}: UseSeasonalSuggestionsProps): UseSeasonalSuggestionsReturn {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SeasonalScheduleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  /**
   * Generate suggestions when conditions are met
   */
  const generateSuggestions = useCallback(async () => {
    if (!enabled || !user || !newSeason || !weatherConditions) return;

    try {
      setIsLoading(true);
      setError(null);

      const newSuggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        user.id,
        newSeason,
        weatherConditions
      );

      setSuggestions(newSuggestions);
      setAppliedSuggestions(new Set()); // Reset applied suggestions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      hookLogger.error(HOOK_NAME, 'Error generating seasonal suggestions', err);
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, user, newSeason, weatherConditions]);

  /**
   * Apply a single suggestion
   */
  const applySuggestion = useCallback(async (plantId: string, days: number) => {
    if (!newSeason || !weatherConditions) return;

    try {
      await scheduleVersioningService.saveSeasonalSchedule(
        plantId,
        newSeason,
        days,
        weatherConditions,
        false // not user modified
      );

      // Mark as applied
      setAppliedSuggestions(prev => new Set([...prev, plantId]));

      // Find the plant name for the toast
      const suggestion = suggestions.find(s => s.plant_id === plantId);
      const plantName = suggestion?.plant_nickname || 'Plant';

      toast.success(`${plantName}'s watering schedule updated to every ${days} days for ${newSeason}.`);

      // Record notification response
      await recordNotificationResponse('applied');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply suggestion';
      hookLogger.error(HOOK_NAME, 'Error applying suggestion', err);
      
      toast.error(errorMessage);
    }
  }, [newSeason, weatherConditions, suggestions]);

  /**
   * Apply all suggestions at once
   */
  const applyAllSuggestions = useCallback(async () => {
    if (!newSeason || !weatherConditions) return;

    try {
      setIsLoading(true);

      const unappliedSuggestions = suggestions.filter(s => !appliedSuggestions.has(s.plant_id));
      
      for (const suggestion of unappliedSuggestions) {
        await scheduleVersioningService.saveSeasonalSchedule(
          suggestion.plant_id,
          newSeason,
          suggestion.suggested_days,
          weatherConditions,
          false
        );
        
        setAppliedSuggestions(prev => new Set([...prev, suggestion.plant_id]));
      }

      toast.success(`Updated watering schedules for ${unappliedSuggestions.length} plants for ${newSeason}.`);

      await recordNotificationResponse('applied');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply all suggestions';
      hookLogger.error(HOOK_NAME, 'Error applying all suggestions', err);
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [suggestions, appliedSuggestions, newSeason, weatherConditions]);

  /**
   * Customize a plant's schedule (user override)
   */
  const customizeSchedule = useCallback(async (plantId: string, days: number) => {
    if (!newSeason || !weatherConditions) return;

    try {
      await scheduleVersioningService.saveSeasonalSchedule(
        plantId,
        newSeason,
        days,
        weatherConditions,
        true // user modified
      );

      // Mark as applied
      setAppliedSuggestions(prev => new Set([...prev, plantId]));

      // Update the suggestion in state to reflect the custom value
      setSuggestions(prev => prev.map(s => 
        s.plant_id === plantId 
          ? { ...s, suggested_days: days, confidence: 'high' as const, based_on: 'hybrid' as const }
          : s
      ));

      const suggestion = suggestions.find(s => s.plant_id === plantId);
      const plantName = suggestion?.plant_nickname || 'Plant';

      toast.success(`${plantName}'s watering schedule customized to every ${days} days for ${newSeason}.`);

      await recordNotificationResponse('customized');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to customize schedule';
      hookLogger.error(HOOK_NAME, 'Error customizing schedule', err);
      
      toast.error(errorMessage);
    }
  }, [newSeason, weatherConditions, suggestions]);

  /**
   * Refresh suggestions manually
   */
  const refreshSuggestions = useCallback(async () => {
    await generateSuggestions();
  }, [generateSuggestions]);

  /**
   * Record user response to notification
   */
  const recordNotificationResponse = useCallback(async (
    responseType: 'applied' | 'dismissed' | 'snoozed' | 'customized'
  ) => {
    if (!user || !newSeason) return;

    try {
      const { error } = await supabase
        .from('seasonal_review_notifications')
        .upsert({
          user_id: user.id,
          season: newSeason,
          year: new Date().getFullYear(),
          response_type: responseType,
          user_responded_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,season,year'
        });

      if (error) throw error;
    } catch (error) {
      hookLogger.error(HOOK_NAME, 'Error recording notification response', error);
    }
  }, [user, newSeason]);

  /**
   * Generate suggestions when dependencies change
   */
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  /**
   * Calculate if there are unapplied suggestions
   */
  const hasUnappliedSuggestions = suggestions.some(s => !appliedSuggestions.has(s.plant_id));

  return {
    suggestions,
    isLoading,
    error,
    applySuggestion,
    applyAllSuggestions,
    customizeSchedule,
    refreshSuggestions,
    hasUnappliedSuggestions
  };
}
