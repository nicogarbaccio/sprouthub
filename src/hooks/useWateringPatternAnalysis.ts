/**
 * React hook for watering pattern analysis with Supabase integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { wateringPatternAnalyzer } from '@/utils/watering-pattern-analyzer';
import {
  WateringPatternAnalysis,
  WateringPatternData,
  WateringRecordForAnalysis,
  PatternInsight,
  PatternAnalysisStats,
} from '@/types/wateringPatternTypes';

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
      console.error('Error fetching watering records:', error);
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
      console.error('Error fetching plant details:', error);
      throw new Error('Failed to fetch plant details');
    }

    return data?.suggested_watering_days || 7;
  }, []);

  /**
   * Perform pattern analysis for a single plant
   */
  const analyzePatternForPlant = useCallback(async (targetPlantId: string): Promise<WateringPatternAnalysis> => {
    try {
      const [records, suggestedDays] = await Promise.all([
        fetchWateringRecords(targetPlantId),
        fetchPlantDetails(targetPlantId),
      ]);

      const analysisData: WateringPatternData = {
        plantId: targetPlantId,
        records,
        suggestedDays,
        analysisDate: new Date(),
      };

      return wateringPatternAnalyzer.analyzePattern(analysisData);
    } catch (err) {
      console.error('Error analyzing pattern for plant:', err);
      throw err;
    }
  }, [fetchWateringRecords, fetchPlantDetails]);

  /**
   * Refresh analysis for current plant
   */
  const refreshAnalysis = useCallback(async () => {
    if (!plantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const records = await fetchWateringRecords(plantId);
      const suggestedDays = await fetchPlantDetails(plantId);

      // Generate analysis
      const analysisData: WateringPatternData = {
        plantId,
        records,
        suggestedDays,
        analysisDate: new Date(),
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
  }, [plantId, fetchWateringRecords, fetchPlantDetails, toast]);

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
          console.error(`Failed to analyze pattern for plant ${id}:`, result.reason);
        }
      });
    } catch (err) {
      console.error('Error analyzing multiple plants:', err);
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
            refreshAnalysis();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [plantId, enableRealTimeUpdates, autoRefresh, refreshAnalysis]);

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
      console.error('Quick analysis error:', error);
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
        .filter((result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      setPlantsWithSuggestions(validResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze plants';
      setError(errorMessage);
      console.error('Bulk analysis error:', err);
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