import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeCareStreak, type StreakPlant, type StreakRecord } from '@/utils/watering/careStreak';

interface CareStreakResult {
  /** True only if every plant's recent waterings were on time */
  hasStreak: boolean;
  /** Number of plants that were watered late recently */
  lateCount: number;
  /** Whole days since a watering last ran late, or since the first watering in the past year */
  streakDays: number;
  /** Share of recent watering intervals that were on time, 0–1. Null without data. */
  onTimeRate: number | null;
  /** How many days `onTimeRate` covers, so the UI can say so */
  lookbackDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far back the streak can reach. A year keeps the query bounded. */
const STREAK_WINDOW_DAYS = 365;

/** Supabase caps a response at 1000 rows by default, so larger histories are paged */
const PAGE_SIZE = 1000;

const EMPTY_RESULT: CareStreakResult = {
  hasStreak: false,
  lateCount: 0,
  streakDays: 0,
  onTimeRate: null,
  lookbackDays: 0,
};

async function fetchRecords(plantIds: string[], since: Date): Promise<StreakRecord[]> {
  const rows: StreakRecord[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('watering_records')
      .select('plant_id, watered_at, record_type')
      .in('plant_id', plantIds)
      .gte('watered_at', since.toISOString())
      .order('watered_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/**
 * Checks the user's care streak from actual watering records rather than the current
 * snapshot. See `computeCareStreak` for what counts as on time.
 */
export const useCareStreak = () => {
  const [streakResult, setStreakResult] = useState<CareStreakResult>(EMPTY_RESULT);
  const [isChecking, setIsChecking] = useState(false);

  const checkStreak = useCallback(async (plants: StreakPlant[]): Promise<void> => {
    if (plants.length === 0) {
      setStreakResult(EMPTY_RESULT);
      return;
    }

    setIsChecking(true);

    try {
      const now = Date.now();
      // The on-time rate covers roughly the last few waterings of the slowest plant
      const maxSchedule = Math.max(...plants.map(p => p.suggested_watering_days ?? 7));
      const lookbackDays = Math.min(90, maxSchedule * 3);

      const records = await fetchRecords(
        plants.map(p => p.id),
        new Date(now - STREAK_WINDOW_DAYS * DAY_MS)
      );

      setStreakResult({
        ...computeCareStreak(plants, records, now, now - lookbackDays * DAY_MS),
        lookbackDays,
      });
    } catch (error) {
      console.error('useCareStreak: Failed to check streak', error);
      setStreakResult(EMPTY_RESULT);
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
