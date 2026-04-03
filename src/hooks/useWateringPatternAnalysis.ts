/**
 * React hook for watering pattern analysis with Supabase integration
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { wateringPatternAnalyzer } from '@/utils/watering/patternAnalyzer';
import {
  WateringPatternAnalysis,
  WateringPatternData,
  WateringRecordForAnalysis,
  PatternInsight,
  PatternAnalysisStats,
} from '@/types/wateringPatternTypes';
import { hookLogger } from '@/utils/hookLogging';

const HOOK_NAME = 'useWateringPatternAnalysis';

interface UseWateringPatternAnalysisOptions {
  plantId?: string;
  autoRefresh?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface UseWateringPatternAnalysisReturn {
  analysis: WateringPatternAnalysis | null;
  insights: PatternInsight[];
  stats: PatternAnalysisStats | null;
  isLoading: boolean;
  error: string | null;
  hasInsufficientData: boolean;
  refreshAnalysis: () => Promise<void>;
  analyzeMultiplePlants: (plantIds: string[]) => Promise<Map<string, WateringPatternAnalysis>>;
}

export function useWateringPatternAnalysis(
  options: UseWateringPatternAnalysisOptions = {}
): UseWateringPatternAnalysisReturn {
  const { plantId, autoRefresh = true, enableRealTimeUpdates = false } = options;
  const { toast } = useToast();

  const [analysis, setAnalysis] = useState<WateringPatternAnalysis | null>(null);
  const [stats, setStats] = useState<PatternAnalysisStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to stabilize refreshAnalysis callback for real-time subscription
  const refreshAnalysisRef = useRef<() => Promise<void>>();

  // Generate insights from current analysis
  const insights = useMemo(() => {
    if (!analysis) return [];
    return wateringPatternAnalyzer.generateInsights(analysis);
  }, [analysis]);

  // Check if we have insufficient data
  const hasInsufficientData = useMemo(() => {
    return analysis?.confidence === 'low' && analysis.reasoning.some(r => r.includes('Need at least'));
  }, [analysis]);

  /**
   * Fetch watering records for a plant
   */
  const fetchWateringRecords = useCallback(async (targetPlantId: string): Promise<WateringRecordForAnalysis[]> => {
    const { data, error } = await supabase
      .from('watering_records')
      .select('id, watered_at, notes')
      .eq('plant_id', targetPlantId)
      .order('watered_at', { ascending: false })
      .limit(20); // Get last 20 records for analysis

    if (error) {
      hookLogger.error(HOOK_NAME, 'Error fetching watering records:', error);
      throw new Error('Failed to fetch watering records');
    }

    return data || [];
  }, []);

  /**
   * Fetch plant details including suggested watering days
   */
  const fetchPlantDetails = useCallback(async (targetPlantId: string) => {
    const { data, error } = await supabase
      .from('user_plants')
      .select('suggested_watering_days')
      .eq('id', targetPlantId)
      .single();

    if (error) {
      hookLogger.error(HOOK_NAME, 'Error fetching plant details:', error);
      throw new Error('Failed to fetch plant details');
    }

    return data?.suggested_watering_days || 7;
  }, []);

  /**
   * Fetch the most recent seasonal transition date for a plant.
   * This is when the schedule was last seasonally adjusted — used to clip
   * the analysis window so we don't mix pre/post-seasonal data.
   */
  const fetchLastSeasonalTransition = useCallback(async (targetPlantId: string): Promise<Date | undefined> => {
    const { data, error } = await supabase
      .from('plant_seasonal_schedules')
      .select('applied_at')
      .eq('plant_id', targetPlantId)
      .not('applied_at', 'is', null)
      .order('applied_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      hookLogger.warn(HOOK_NAME, 'Could not fetch seasonal transition date', { error });
      return undefined;
    }

    return data?.applied_at ? new Date(data.applied_at) : undefined;
  }, []);

  /**
   * Perform pattern analysis for a single plant
   */
  const analyzePatternForPlant = useCallback(async (targetPlantId: string): Promise<WateringPatternAnalysis> => {
    try {
      const [records, suggestedDays, lastSeasonalTransitionDate] = await Promise.all([
        fetchWateringRecords(targetPlantId),
        fetchPlantDetails(targetPlantId),
        fetchLastSeasonalTransition(targetPlantId),
      ]);

      const analysisData: WateringPatternData = {
        plantId: targetPlantId,
        records,
        suggestedDays,
        analysisDate: new Date(),
        lastSeasonalTransitionDate,
      };

      return wateringPatternAnalyzer.analyzePattern(analysisData);
    } catch (err) {
      hookLogger.error(HOOK_NAME, 'Error analyzing pattern for plant:', err);
      throw err;
    }
  }, [fetchWateringRecords, fetchPlantDetails, fetchLastSeasonalTransition]);

  /**
   * Refresh analysis for current plant
   */
  const refreshAnalysis = useCallback(async () => {
    if (!plantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [records, suggestedDays, lastSeasonalTransitionDate] = await Promise.all([
        fetchWateringRecords(plantId),
        fetchPlantDetails(plantId),
        fetchLastSeasonalTransition(plantId),
      ]);

      // Generate analysis
      const analysisData: WateringPatternData = {
        plantId,
        records,
        suggestedDays,
        analysisDate: new Date(),
        lastSeasonalTransitionDate,
      };

      const newAnalysis = wateringPatternAnalyzer.analyzePattern(analysisData);
      const newStats = wateringPatternAnalyzer.getAnalysisStats(records, new Date());

      setAnalysis(newAnalysis);
      setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze watering pattern';
      setError(errorMessage);
      toast({
        title: 'Analysis Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [plantId, fetchWateringRecords, fetchPlantDetails, fetchLastSeasonalTransition, toast]);

  // Update ref when refreshAnalysis changes
  useEffect(() => {
    refreshAnalysisRef.current = refreshAnalysis;
  }, [refreshAnalysis]);

  /**
   * Analyze multiple plants at once
   */
  const analyzeMultiplePlants = useCallback(async (plantIds: string[]): Promise<Map<string, WateringPatternAnalysis>> => {
    const results = new Map<string, WateringPatternAnalysis>();

    try {
      const analyses = await Promise.allSettled(
        plantIds.map(id => analyzePatternForPlant(id))
      );

      plantIds.forEach((id, index) => {
        const result = analyses[index];
        if (result.status === 'fulfilled') {
          results.set(id, result.value);
        } else {
          hookLogger.error(HOOK_NAME, `Failed to analyze pattern for plant ${id}`, result.reason);
        }
      });
    } catch (err) {
      hookLogger.error(HOOK_NAME, 'Error analyzing multiple plants:', err);
      toast({
        title: 'Bulk Analysis Error',
        description: 'Failed to analyze some plants',
        variant: 'destructive',
      });
    }

    return results;
  }, [analyzePatternForPlant, toast]);

  /**
   * Set up real-time updates for watering records
   */
  useEffect(() => {
    if (!enableRealTimeUpdates || !plantId) return;

    const subscription = supabase
      .channel(`watering_records_${plantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watering_records',
          filter: `plant_id=eq.${plantId}`,
        },
        () => {
          // Refresh analysis when new watering record is added
          if (autoRefresh) {
            refreshAnalysisRef.current?.();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [plantId, enableRealTimeUpdates, autoRefresh]); // refreshAnalysis accessed via ref to prevent re-subscription

  /**
   * Initial analysis load
   */
  useEffect(() => {
    if (plantId && autoRefresh) {
      refreshAnalysis();
    }
  }, [plantId, autoRefresh, refreshAnalysis]);

  /**
   * Clear analysis when plantId changes
   */
  useEffect(() => {
    if (!plantId) {
      setAnalysis(null);
      setStats(null);
      setError(null);
    }
  }, [plantId]);

  return {
    analysis,
    insights,
    stats,
    isLoading,
    error,
    hasInsufficientData,
    refreshAnalysis,
    analyzeMultiplePlants,
  };
}

/**
 * Simplified hook for quick pattern analysis without state management
 */
export function useQuickPatternAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeQuick = useCallback(async (
    plantId: string
  ): Promise<WateringPatternAnalysis | null> => {
    setIsAnalyzing(true);
    
    try {
      const { data: records } = await supabase
        .from('watering_records')
        .select('id, watered_at, notes')
        .eq('plant_id', plantId)
        .order('watered_at', { ascending: false })
        .limit(10);

      const { data: plant } = await supabase
        .from('user_plants')
        .select('suggested_watering_days')
        .eq('id', plantId)
        .single();

      if (!records || !plant) return null;

      const analysisData: WateringPatternData = {
        plantId,
        records,
        suggestedDays: plant.suggested_watering_days || 7,
        analysisDate: new Date(),
      };

      return wateringPatternAnalyzer.analyzePattern(analysisData);
    } catch (error) {
      hookLogger.error(HOOK_NAME, 'Quick analysis error:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeQuick,
    isAnalyzing,
  };
}

/**
 * Hook for bulk analysis of multiple plants to detect pending suggestions
 */
export function useBulkPatternAnalysis(plantIds: string[]) {
  const [plantsWithSuggestions, setPlantsWithSuggestions] = useState<
    Array<{ plantId: string; insights: PatternInsight[]; analysis: WateringPatternAnalysis }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stabilize plantIds to prevent infinite re-renders - create a stable string representation
  const plantIdsKey = useMemo(() => plantIds.join(','), [plantIds]);

  const analyzePlants = useCallback(async () => {
    if (plantIds.length === 0) {
      setPlantsWithSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        plantIds.map(async (plantId) => {
          const [
            { data: records },
            { data: plant },
            { data: seasonalRow },
          ] = await Promise.all([
            supabase
              .from('watering_records')
              .select('id, watered_at, notes')
              .eq('plant_id', plantId)
              .order('watered_at', { ascending: false })
              .limit(15),
            supabase
              .from('user_plants')
              .select('suggested_watering_days, last_schedule_review')
              .eq('id', plantId)
              .single(),
            supabase
              .from('plant_seasonal_schedules')
              .select('applied_at')
              .eq('plant_id', plantId)
              .not('applied_at', 'is', null)
              .order('applied_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (!records || !plant) return null;

          // Skip plants that had a seasonal schedule review recently (within 14 days)
          // This prevents smart suggestions from immediately contradicting seasonal adjustments
          if (plant.last_schedule_review) {
            const reviewDate = new Date(plant.last_schedule_review);
            const daysSinceReview = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceReview < 14) return null;
          }

          const lastSeasonalTransitionDate = seasonalRow?.applied_at
            ? new Date(seasonalRow.applied_at)
            : undefined;

          const analysisData: WateringPatternData = {
            plantId,
            records,
            suggestedDays: plant.suggested_watering_days || 7,
            analysisDate: new Date(),
            lastSeasonalTransitionDate,
          };

          const analysis = wateringPatternAnalyzer.analyzePattern(analysisData);
          const insights = wateringPatternAnalyzer.generateInsights(analysis);

          // Only include plants with actionable insights
          const actionableInsights = insights.filter(insight => insight.actionable);
          if (actionableInsights.length > 0) {
            return { plantId, insights: actionableInsights, analysis };
          }

          return null;
        })
      );

      const validResults = results
        .filter((result): result is PromiseFulfilledResult<{ plantId: string; insights: PatternInsight[]; analysis: WateringPatternAnalysis }> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      setPlantsWithSuggestions(validResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze plants';
      setError(errorMessage);
      hookLogger.error(HOOK_NAME, 'Bulk analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [plantIdsKey, plantIds]);

  useEffect(() => {
    analyzePlants();
  }, [plantIdsKey]);

  const totalSuggestions = plantsWithSuggestions.reduce(
    (sum, plant) => sum + plant.insights.length,
    0
  );

  const highPrioritySuggestions = plantsWithSuggestions.reduce(
    (sum, plant) => sum + plant.insights.filter(insight => insight.severity === 'high').length,
    0
  );

  return {
    plantsWithSuggestions,
    totalSuggestions,
    highPrioritySuggestions,
    isLoading,
    error,
    refreshAnalysis: analyzePlants,
  };
}