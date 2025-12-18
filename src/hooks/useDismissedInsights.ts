/**
 * Hook for managing dismissed pattern insights with database persistence
 * Allows users to permanently dismiss suggestions so they don't get nagged repeatedly
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PatternInsight } from '@/types/wateringPatternTypes';

interface DismissedInsight {
  id: string;
  user_plant_id: string;
  insight_type: string;
  dismissed_at: string;
}

export const useDismissedInsights = (plantId: string | undefined) => {
  const [dismissedTypes, setDismissedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load dismissed insights from database
  const loadDismissedInsights = useCallback(async () => {
    if (!plantId) {
      setDismissedTypes(new Set());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('dismissed_pattern_insights')
        .select('insight_type')
        .eq('user_plant_id', plantId);

      if (fetchError) throw fetchError;

      const types = new Set(data?.map((d) => d.insight_type) || []);
      setDismissedTypes(types);
    } catch (err) {
      console.error('Error loading dismissed insights:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  // Load on mount and when plantId changes
  useEffect(() => {
    loadDismissedInsights();
  }, [loadDismissedInsights]);

  // Dismiss an insight permanently
  const dismissInsight = useCallback(
    async (insight: PatternInsight) => {
      if (!plantId) return false;

      try {
        const { error: insertError } = await supabase
          .from('dismissed_pattern_insights')
          .insert({
            user_plant_id: plantId,
            insight_type: insight.type,
          });

        if (insertError) {
          // Check if it's a duplicate key error (already dismissed)
          if (insertError.code === '23505') {
            // Already dismissed, update local state anyway
            setDismissedTypes((prev) => new Set([...prev, insight.type]));
            return true;
          }
          throw insertError;
        }

        // Update local state
        setDismissedTypes((prev) => new Set([...prev, insight.type]));
        return true;
      } catch (err) {
        console.error('Error dismissing insight:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        return false;
      }
    },
    [plantId]
  );

  // Un-dismiss an insight (allow it to show again)
  const undismissInsight = useCallback(
    async (insightType: string) => {
      if (!plantId) return false;

      try {
        const { error: deleteError } = await supabase
          .from('dismissed_pattern_insights')
          .delete()
          .eq('user_plant_id', plantId)
          .eq('insight_type', insightType);

        if (deleteError) throw deleteError;

        // Update local state
        setDismissedTypes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(insightType);
          return newSet;
        });
        return true;
      } catch (err) {
        console.error('Error undismissing insight:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        return false;
      }
    },
    [plantId]
  );

  // Clear all dismissed insights for this plant
  const clearAllDismissals = useCallback(async () => {
    if (!plantId) return false;

    try {
      const { error: deleteError } = await supabase
        .from('dismissed_pattern_insights')
        .delete()
        .eq('user_plant_id', plantId);

      if (deleteError) throw deleteError;

      setDismissedTypes(new Set());
      return true;
    } catch (err) {
      console.error('Error clearing dismissed insights:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return false;
    }
  }, [plantId]);

  // Check if an insight is dismissed
  const isDismissed = useCallback(
    (insightType: string) => {
      return dismissedTypes.has(insightType);
    },
    [dismissedTypes]
  );

  // Filter insights to exclude dismissed ones
  const filterDismissed = useCallback(
    (insights: PatternInsight[]) => {
      return insights.filter((insight) => !dismissedTypes.has(insight.type));
    },
    [dismissedTypes]
  );

  return {
    dismissedTypes,
    loading,
    error,
    dismissInsight,
    undismissInsight,
    clearAllDismissals,
    isDismissed,
    filterDismissed,
    reload: loadDismissedInsights,
  };
};
