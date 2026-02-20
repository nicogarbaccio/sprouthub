import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
 * Hook that checks whether all plants have been watered on time recently
 * by examining actual watering records (not just current snapshot).
 *
 * A plant is considered "on time" if the interval between its last two
 * waterings did not exceed its schedule by more than 1 day (grace period).
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
        .not('notes', 'like', '%POSTPONEMENT:%')
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

        // Need at least 2 records to check an interval
        if (plantRecords.length < 2) {
          // If a plant has fewer than 2 records, we can't verify a streak
          // Don't count it as late, but don't count it as on-streak either
          // unless it's a brand new plant (only 1 watering)
          if (plantRecords.length === 0) {
            lateCount++;
          }
          continue;
        }

        // Check the most recent interval (records are desc by watered_at)
        const mostRecent = new Date(plantRecords[0]);
        const secondMostRecent = new Date(plantRecords[1]);
        const intervalDays = Math.round(
          (mostRecent.getTime() - secondMostRecent.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Allow 1 day grace period beyond the schedule
        if (intervalDays > schedule + 1) {
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
