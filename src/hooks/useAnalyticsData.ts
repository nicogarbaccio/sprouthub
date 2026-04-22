import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserPlant } from '@/hooks/useUserPlants';
import { useWateringPatternAnalysis } from '@/hooks/useWateringPatternAnalysis';
import { usePostponementData } from '@/hooks/usePostponementData';
import { POSTPONEMENT_PREFIX } from '@/utils/watering/notesPrefixes';
import { scheduleVersioningService } from '@/services/scheduleVersioningService';
import type { PlantMood } from '@/types/journalTypes';
import {
  calculatePlantPerformance,
  mergePerformanceWithAnalysis,
  type PlantPerformance,
} from '@/utils/analytics';

export interface MoodSummary {
  dominantMood: PlantMood;
  totalEntries: number;
  trend: 'improving' | 'declining' | 'stable';
}

const CARE_SCORE_WINDOW_DAYS = 90;

const MOOD_SCORES: Record<string, number> = {
  thriving: 5,
  healthy: 4,
  neutral: 3,
  stressed: 2,
  declining: 1,
};

/**
 * Fetch journal mood entries for the last 90 days across all plants,
 * grouped by plant ID with summary stats and trend.
 */
async function fetchMoodSummaries(
  plantIds: string[],
): Promise<Map<string, MoodSummary>> {
  const windowStart = new Date(
    Date.now() - CARE_SCORE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('plant_journal_entries')
    .select('plant_id, mood, entry_date')
    .in('plant_id', plantIds)
    .gte('entry_date', windowStart)
    .not('mood', 'is', null)
    .order('entry_date', { ascending: false });

  if (error) throw error;

  const map = new Map<string, MoodSummary>();
  const grouped = new Map<string, { mood: string; entry_date: string }[]>();

  for (const row of data || []) {
    if (!row.mood) continue;
    const list = grouped.get(row.plant_id) || [];
    list.push({ mood: row.mood, entry_date: row.entry_date ?? '' });
    grouped.set(row.plant_id, list);
  }

  const midpoint = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const [plantId, entries] of grouped) {
    // Dominant mood
    const moodCounts: Record<string, number> = {};
    for (const e of entries) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0][0] as PlantMood;

    // Trend: compare avg score of last 30 days vs previous 30 days
    const recent: number[] = [];
    const older: number[] = [];
    for (const e of entries) {
      const score = MOOD_SCORES[e.mood] ?? 3;
      if (new Date(e.entry_date) >= midpoint) {
        recent.push(score);
      } else {
        older.push(score);
      }
    }

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const olderAvg = older.reduce((s, v) => s + v, 0) / older.length;
      if (recentAvg - olderAvg >= 0.5) trend = 'improving';
      else if (olderAvg - recentAvg >= 0.5) trend = 'declining';
    }

    map.set(plantId, { dominantMood, totalEntries: entries.length, trend });
  }

  return map;
}

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
export interface SeasonalScheduleRow {
  plant_id: string | null;
  season: string;
  year: number;
  watering_days: number;
  user_plants?: { nickname: string; plant_type: string };
}

export function useAnalyticsData(plants: UserPlant[], userId?: string) {
  const { analyzeMultiplePlants } = useWateringPatternAnalysis();
  const { fetchPostponementsGrouped } = usePostponementData();

  const [enrichedPerformance, setEnrichedPerformance] = useState<PlantPerformance[]>([]);
  const [wateringRecords, setWateringRecords] = useState<Map<string, { watered_at: string }[]>>(new Map());
  const [moodSummaries, setMoodSummaries] = useState<Map<string, MoodSummary>>(new Map());
  const [seasonalSchedules, setSeasonalSchedules] = useState<SeasonalScheduleRow[]>([]);
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

      const [analysisMap, postponementMap, wateringRecordsMap, moodMap, schedules] = await Promise.all([
        analyzeMultiplePlants(plantIds),
        fetchPostponementsGrouped(plantIds),
        fetchWateringRecordsGrouped(plantIds),
        fetchMoodSummaries(plantIds),
        userId
          ? scheduleVersioningService.getUserSeasonalSchedules(userId).catch(() => [])
          : Promise.resolve([]),
      ]);

      setWateringRecords(wateringRecordsMap);
      setMoodSummaries(moodMap);
      setSeasonalSchedules(schedules as SeasonalScheduleRow[]);
      setEnrichedPerformance(
        mergePerformanceWithAnalysis(base, analysisMap, postponementMap, wateringRecordsMap, moodMap),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setEnrichedPerformance(calculatePlantPerformance(plants));
    } finally {
      setIsLoading(false);
    }
  }, [plants, userId, analyzeMultiplePlants, fetchPostponementsGrouped]);

  useEffect(() => {
    enrich();
  }, [enrich]);

  return { enrichedPerformance, wateringRecords, moodSummaries, seasonalSchedules, isLoading, error };
}
