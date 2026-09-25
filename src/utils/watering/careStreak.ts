/**
 * Care streak: how long the user has kept every plant watered on time.
 *
 * A watering is "on time" when it happens by the plant's deadline, where the deadline is
 * whichever is later of
 *   - the last watering + the plant's schedule, or
 *   - a postponed due date the user set during that cycle ("Push to tomorrow"),
 * plus a grace period of 10% of the schedule (minimum 1 day). Postponing is a deliberate
 * choice, so it moves the deadline instead of counting against the user.
 *
 * The streak counts calendar days, not waterings: a day when nothing is due still counts,
 * because leaving a plant alone until it needs water is the right care.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StreakPlant {
  id: string;
  suggested_watering_days?: number;
}

export interface StreakRecord {
  plant_id: string;
  watered_at: string;
  /** 'postponement' rows carry the postponed-until date in `watered_at` */
  record_type?: string | null;
}

export interface CareStreakStats {
  /** True when every plant with enough history is meeting its compliance threshold */
  hasStreak: boolean;
  /** Plants whose recent on-time rate is below their compliance threshold */
  lateCount: number;
  /** Whole days since a watering last ran late (or since the first watering on record) */
  streakDays: number;
  /** Share of recent intervals that were on time, 0–1. Null without enough history. */
  onTimeRate: number | null;
}

/**
 * Proportional grace period: 10% of the schedule, minimum 1 day.
 * A 7-day schedule gets 1 day of grace; a 30-day schedule gets 3 days.
 */
export function gracePeriodDays(scheduleDays: number): number {
  return Math.max(1, Math.round(scheduleDays * 0.1));
}

/**
 * Species-appropriate compliance threshold based on schedule length. Drought-tolerant plants
 * (long schedules) tolerate more variation than moisture-sensitive ones (short schedules).
 */
function complianceThreshold(scheduleDays: number): number {
  if (scheduleDays >= 14) return 0.6;
  if (scheduleDays <= 5) return 0.85;
  return 0.75;
}

/**
 * Deadline for the watering that follows `lastWatered`: the scheduled date, or the latest
 * postponed date set after `lastWatered` (and no later than `before`, so a postponement for the
 * *next* cycle can't excuse this one), plus grace.
 */
function deadlineAfter(
  lastWatered: number,
  scheduleDays: number,
  postponements: number[],
  before: number
): number {
  let due = lastWatered + scheduleDays * DAY_MS;
  for (const target of postponements) {
    if (target > lastWatered && target <= before && target > due) due = target;
  }
  return due + gracePeriodDays(scheduleDays) * DAY_MS;
}

/**
 * @param records - waterings and postponements for `plants`, any order
 * @param recentSince - only intervals ending after this count toward `onTimeRate` and
 *   `hasStreak`; older ones still inform `streakDays`
 */
export function computeCareStreak(
  plants: StreakPlant[],
  records: StreakRecord[],
  now: number,
  recentSince: number
): CareStreakStats {
  let lateCount = 0;
  let recentIntervals = 0;
  let recentOnTime = 0;
  // Most recent moment the streak broke; the streak runs from there
  let lastBreak = 0;
  let firstWatering = Infinity;

  for (const plant of plants) {
    const schedule = plant.suggested_watering_days ?? 7;
    const mine = records.filter((r) => r.plant_id === plant.id);
    const waterings = mine
      .filter((r) => r.record_type !== "postponement")
      .map((r) => new Date(r.watered_at).getTime())
      .filter((t) => t <= now)
      .sort((a, b) => a - b);
    const postponements = mine
      .filter((r) => r.record_type === "postponement")
      .map((r) => new Date(r.watered_at).getTime());

    // No history means no schedule to judge against; brand-new plants don't count against you
    if (waterings.length === 0) continue;
    firstWatering = Math.min(firstWatering, waterings[0]);

    let plantRecent = 0;
    let plantRecentLate = 0;
    for (let i = 1; i < waterings.length; i++) {
      const late = waterings[i] > deadlineAfter(waterings[i - 1], schedule, postponements, waterings[i]);
      // A late watering breaks the streak on the day it finally happened, so catching up
      // restarts the count from zero rather than crediting the days the plant sat waiting
      if (late) lastBreak = Math.max(lastBreak, waterings[i]);
      if (waterings[i] >= recentSince) {
        plantRecent++;
        if (late) plantRecentLate++;
      }
    }

    // A plant that's late right now breaks the streak until it's watered
    const last = waterings[waterings.length - 1];
    if (now > deadlineAfter(last, schedule, postponements, Infinity)) {
      lastBreak = now;
    }

    recentIntervals += plantRecent;
    recentOnTime += plantRecent - plantRecentLate;
    if (plantRecent > 0 && (plantRecent - plantRecentLate) / plantRecent < complianceThreshold(schedule)) {
      lateCount++;
    }
  }

  const streakStart = lastBreak || (Number.isFinite(firstWatering) ? firstWatering : now);

  return {
    hasStreak: lateCount === 0,
    lateCount,
    streakDays: Math.max(0, Math.floor((now - streakStart) / DAY_MS)),
    onTimeRate: recentIntervals > 0 ? recentOnTime / recentIntervals : null,
  };
}
