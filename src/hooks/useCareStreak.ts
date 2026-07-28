import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { POSTPONEMENT_LIKE_PATTERN } from '@/utils/watering/notesPrefixes';

interface PlantWithSchedule {
  id: string;
  suggested_watering_days?: number;
}

interface CareStreakResult {
  /** True only if every plant's recent waterings were on time */
  hasStreak: boolean;
  /** Number of plants that were watered late recently */
  lateCount: number;
}

/**
 * Returns a species-appropriate compliance threshold based on schedule length.
 *
 * Plants with longer schedules are drought-tolerant and can tolerate more
 * variation; short-schedule plants are moisture-sensitive and need tighter
 * compliance. Using the schedule length as a proxy is botanically sound when
 * explicit category data isn't available.
 */
function complianceThreshold(scheduleDays: number): number {
  if (scheduleDays >= 14) return 0.60; // drought-tolerant (cactus, succulent, ZZ, etc.)
  if (scheduleDays <= 5) return 0.85;  // moisture-sensitive (fern, calathea, etc.)
  return 0.75;                         // typical houseplant
}

/**
 * Proportional grace period: 10% of the schedule, minimum 1 day.
 * A 7-day schedule gets 1 day of grace; a 30-day schedule gets 3 days.
 */
function gracePeriod(scheduleDays: number): number {
  return Math.max(1, Math.round(scheduleDays * 0.1));
}

/**
 * Hook that checks whether all plants have been watered on time recently
 * by examining actual watering records (not just current snapshot).
 *
 * A plant is considered "on time" if the interval between its last two
 * waterings did not exceed its schedule by more than a proportional grace
 * period (10% of schedule, minimum 1 day).
 */
export const useCareStreak = () => {
  const [streakResult, setStreakResult] = useState<CareStreakResult>({
    hasStreak: false,
    lateCount: 0,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStreak = useCallback(async (plants: PlantWithSchedule[]): Promise<void> => {
    if (plants.length === 0) {
      setStreakResult({ hasStreak: false, lateCount: 0 });
      return;
    }

    setIsChecking(true);

    try {
      // Look back far enough to get at least 2 waterings per plant
      const maxSchedule = Math.max(...plants.map(p => p.suggested_watering_days ?? 7));
      const lookbackDays = Math.min(90, maxSchedule * 3);
      const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

      const { data: records, error } = await supabase
        .from('watering_records')
        .select('plant_id, watered_at, notes')
        .in('plant_id', plants.map(p => p.id))
        .gte('watered_at', startDate.toISOString())
        .not('notes', 'like', POSTPONEMENT_LIKE_PATTERN)
        .order('watered_at', { ascending: false });

      if (error) throw error;

      const wateringRecords = records || [];

      // Group records by plant
      const recordsByPlant = new Map<string, string[]>();
      for (const record of wateringRecords) {
        const existing = recordsByPlant.get(record.plant_id) || [];
        existing.push(record.watered_at);
        recordsByPlant.set(record.plant_id, existing);
      }

      let lateCount = 0;

      for (const plant of plants) {
        const schedule = plant.suggested_watering_days ?? 7;
        const plantRecords = recordsByPlant.get(plant.id) || [];

        // Need at least 2 records to compute any interval.
        // Plants with 0 records are brand-new and shouldn't count against the streak.
        // Plants with exactly 1 record don't yet have a measurable interval — skip them.
        if (plantRecords.length < 2) {
          continue;
        }

        // Check all intervals in the lookback window, not just the most recent.
        // A single on-time watering after a string of missed ones shouldn't reset
        // the score — we need a majority of intervals to be on time.
        const intervals: number[] = [];
        for (let i = 0; i < plantRecords.length - 1; i++) {
          const newer = new Date(plantRecords[i]);
          const older = new Date(plantRecords[i + 1]);
          const days = Math.round(
            (newer.getTime() - older.getTime()) / (1000 * 60 * 60 * 24)
          );
          intervals.push(days);
        }

        // Proportional grace period (10% of schedule, min 1 day) and
        // species-appropriate compliance threshold based on schedule length.
        const grace = gracePeriod(schedule);
        const lateIntervals = intervals.filter(d => d > schedule + grace);
        const complianceRate = (intervals.length - lateIntervals.length) / intervals.length;

        if (complianceRate < complianceThreshold(schedule)) {
          lateCount++;
        }
      }

      setStreakResult({
        hasStreak: lateCount === 0,
        lateCount,
      });
    } catch (error) {
      console.error('useCareStreak: Failed to check streak', error);
      setStreakResult({ hasStreak: false, lateCount: 0 });
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    ...streakResult,
    isChecking,
    checkStreak,
  };
};
