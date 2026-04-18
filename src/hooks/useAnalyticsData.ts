import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserPlant } from '@/hooks/useUserPlants';
import { useWateringPatternAnalysis } from '@/hooks/useWateringPatternAnalysis';
import { usePostponementData } from '@/hooks/usePostponementData';
import { POSTPONEMENT_PREFIX } from '@/utils/watering/notesPrefixes';
import {
  calculatePlantPerformance,
  mergePerformanceWithAnalysis,
  type PlantPerformance,
} from '@/utils/analytics';

const CARE_SCORE_WINDOW_DAYS = 90;

/**
 * Fetch actual watering records (excluding postponements) for the last
 * 90 days across all given plants in a single query. Returns a map
 * keyed by plant ID.
 */
async function fetchWateringRecordsGrouped(
  plantIds: string[],
): Promise<Map<string, { watered_at: string }[]>> {
  const windowStart = new Date(
    Date.now() - CARE_SCORE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('watering_records')
    .select('plant_id, watered_at, notes')
    .in('plant_id', plantIds)
    .gte('watered_at', windowStart)
    .order('watered_at', { ascending: false });

  if (error) throw error;

  const map = new Map<string, { watered_at: string }[]>();
  for (const row of data || []) {
    // Exclude postponements — they aren't real waterings
    if (row.notes?.includes(POSTPONEMENT_PREFIX)) continue;

    const list = map.get(row.plant_id) || [];
    list.push({ watered_at: row.watered_at });
    map.set(row.plant_id, list);
  }

  return map;
}

/**
 * Composes useWateringPatternAnalysis, usePostponementData, and a direct
 * watering-records query to produce enriched PlantPerformance rows.
 *
 * Care scores are computed from the full 90-day watering history (single
 * bulk query, no seasonal clipping) so plants with plenty of history
 * always get a real score. Pattern classification and tips still come
 * from the pattern analyzer when available.
 */
export function useAnalyticsData(plants: UserPlant[]) {
  const { analyzeMultiplePlants } = useWateringPatternAnalysis();
  const { fetchPostponementsGrouped } = usePostponementData();

  const [enrichedPerformance, setEnrichedPerformance] = useState<PlantPerformance[]>([]);
  const [wateringRecords, setWateringRecords] = useState<Map<string, { watered_at: string }[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrich = useCallback(async () => {
    if (plants.length === 0) {
      setEnrichedPerformance([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const plantIds = plants.map(p => p.id);
      const base = calculatePlantPerformance(plants);

      const [analysisMap, postponementMap, wateringRecordsMap] = await Promise.all([
        analyzeMultiplePlants(plantIds),
        fetchPostponementsGrouped(plantIds),
        fetchWateringRecordsGrouped(plantIds),
      ]);

      setWateringRecords(wateringRecordsMap);
      setEnrichedPerformance(
        mergePerformanceWithAnalysis(base, analysisMap, postponementMap, wateringRecordsMap),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setEnrichedPerformance(calculatePlantPerformance(plants));
    } finally {
      setIsLoading(false);
    }
  }, [plants, analyzeMultiplePlants, fetchPostponementsGrouped]);

  useEffect(() => {
    enrich();
  }, [enrich]);

  return { enrichedPerformance, wateringRecords, isLoading, error };
}
