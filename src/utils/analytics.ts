import type { UserPlant } from '@/hooks/useUserPlants';
import type { WateringPatternAnalysis } from '@/types/wateringPatternTypes';
import type { PostponementRecord } from '@/hooks/usePostponementData';
import { differenceInDays, format, startOfWeek, startOfMonth, subDays } from 'date-fns';

export interface Insight {
  names: string; // plant name(s) to highlight
  message: string; // the rest of the insight text
}

export interface WateringStats {
  totalWaterings: number;
  thisWeek: number;
  thisMonth: number;
  averagePerWeek: number;
  streak: number;
  longestStreak: number;
}

export interface PlantHealthStats {
  totalPlants: number;
  healthyPlants: number;
  needsAttention: number;
  overduePlants: number;
  onSchedule: number;
  overwateringRisk: number;
}

export interface WateringFrequency {
  date: string;
  count: number;
}

export interface PlantPerformance {
  plantId: string;
  plantName: string;
  plantType: string;
  plantImage?: string;
  totalWaterings: number;
  onTimeWaterings: number;
  lateWaterings: number;
  careScore: number; // 0-100, based on watering interval consistency over time
  daysOwned: number;
  postponementCount: number;
  pattern: 'early' | 'late' | 'consistent' | 'irregular' | 'insufficient';
  avgInterval: number;
  scheduleDays: number;
  tip: string | null; // actionable guidance for the user
}

export interface TimeDistribution {
  period: string;
  waterings: number;
}

/**
 * Calculate overall watering statistics.
 *
 * When allRecords is provided (from the 90-day bulk query), uses the full
 * history for accurate counts. Falls back to latest_watering per plant if
 * records aren't available yet.
 */
export function calculateWateringStats(
  plants: UserPlant[],
  allRecords?: Map<string, { watered_at: string }[]>,
): WateringStats {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  let totalWaterings = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  if (allRecords && allRecords.size > 0) {
    for (const records of allRecords.values()) {
      for (const record of records) {
        totalWaterings++;
        const d = new Date(record.watered_at);
        if (d >= weekStart) thisWeek++;
        if (d >= monthStart) thisMonth++;
      }
    }
  } else {
    plants.forEach(plant => {
      if (plant.latest_watering) {
        totalWaterings++;
        const wateringDate = new Date(plant.latest_watering);
        if (wateringDate >= weekStart) thisWeek++;
        if (wateringDate >= monthStart) thisMonth++;
      }
    });
  }

  // Weeks in the 90-day window (or fallback to 4)
  const weeksInWindow = allRecords ? 13 : 4;
  const averagePerWeek = totalWaterings / weeksInWindow;

  const streak = calculateCurrentStreak(plants);
  const longestStreak = streak;

  return {
    totalWaterings,
    thisWeek,
    thisMonth,
    averagePerWeek: Math.round(averagePerWeek * 10) / 10,
    streak,
    longestStreak,
  };
}

/**
 * Calculate plant health statistics
 */
export function calculatePlantHealthStats(plants: UserPlant[]): PlantHealthStats {
  let healthyPlants = 0;
  let needsAttention = 0;
  let overduePlants = 0;
  let onSchedule = 0;
  let overwateringRisk = 0;

  plants.forEach(plant => {
    const daysSinceWatering = plant.days_since_watering || 0;
    const scheduleDays = plant.suggested_watering_days || 7;
    const daysUntilDue = scheduleDays - daysSinceWatering;

    // Overdue
    if (daysUntilDue < 0) {
      overduePlants++;
      needsAttention++;
    }
    // Due today or tomorrow
    else if (daysUntilDue <= 1) {
      needsAttention++;
    }
    // On schedule (2+ days until watering)
    else if (daysUntilDue >= 2) {
      onSchedule++;
      healthyPlants++;
    }

    // Check for overwatering risk (watered within 30% of schedule)
    if (daysSinceWatering < scheduleDays * 0.3) {
      overwateringRisk++;
    }
  });

  return {
    totalPlants: plants.length,
    healthyPlants,
    needsAttention,
    overduePlants,
    onSchedule,
    overwateringRisk,
  };
}

/**
 * Get watering frequency over the last 30 days
 */
export function getWateringFrequency(plants: UserPlant[], days: number = 30): WateringFrequency[] {
  const now = new Date();
  const frequency: Record<string, number> = {};

  // Initialize all dates with 0
  for (let i = 0; i < days; i++) {
    const date = subDays(now, i);
    frequency[format(date, 'yyyy-MM-dd')] = 0;
  }

  // Count waterings per day (simplified - uses latest_watering only)
  plants.forEach(plant => {
    if (plant.latest_watering) {
      const wateringDate = format(new Date(plant.latest_watering), 'yyyy-MM-dd');
      if (frequency.hasOwnProperty(wateringDate)) {
        frequency[wateringDate]++;
      }
    }
  });

  return Object.entries(frequency)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate plant performance metrics (base data from UserPlant).
 * Returns skeleton PlantPerformance entries that can be enriched
 * via mergePerformanceWithAnalysis once pattern analysis completes.
 */
export function calculatePlantPerformance(plants: UserPlant[]): PlantPerformance[] {
  return plants.map(plant => {
    const daysOwned = plant.created_at
      ? differenceInDays(new Date(), new Date(plant.created_at))
      : 0;

    const scheduleDays = plant.suggested_watering_days || 7;
    const daysSinceWatering = plant.days_since_watering || 0;
    const isOnTime = daysSinceWatering <= scheduleDays;

    return {
      plantId: plant.id,
      plantName: plant.nickname,
      plantType: plant.plant_type,
      plantImage: plant.image,
      totalWaterings: plant.latest_watering ? 1 : 0,
      onTimeWaterings: isOnTime ? 1 : 0,
      lateWaterings: isOnTime ? 0 : 1,
      careScore: -1, // -1 signals "not yet computed" — will be replaced by enrichment
      daysOwned,
      postponementCount: plant.postponement_count || 0,
      pattern: 'insufficient' as const,
      avgInterval: 0,
      scheduleDays,
      tip: null,
    };
  }).sort((a, b) => a.plantName.localeCompare(b.plantName));
}

/**
 * Compute a 0-100 care score from pattern analysis data.
 *
 * The score reflects how consistently the user waters relative to the
 * plant's schedule, with a small penalty for frequent postponements.
 * Grace period logic mirrors useCareStreak (10 % of schedule, min 1 day).
 */
export function calculateCareScore(
  actualAvgInterval: number,
  scheduleDays: number,
  pattern: WateringPatternAnalysis['pattern'],
  postponementCount: number,
): number {
  const grace = Math.max(1, Math.round(scheduleDays * 0.1));
  const deviation = Math.abs(actualAvgInterval - scheduleDays);

  // Base score: full marks within grace, linear drop-off beyond
  let score: number;
  if (deviation <= grace) {
    score = 100;
  } else {
    score = Math.max(20, 100 - ((deviation - grace) / scheduleDays) * 80);
  }

  // Pattern bonus / penalty
  if (pattern === 'consistent') score = Math.min(100, score + 5);
  if (pattern === 'irregular') score = Math.max(0, score - 10);

  // Postponement penalty: -2 per postponement, capped at -10
  const postponePenalty = Math.min(10, postponementCount * 2);
  score = Math.max(0, score - postponePenalty);

  return Math.round(score);
}

/**
 * Generate an actionable tip based on analysis data.
 */
function generateTip(
  analysis: WateringPatternAnalysis,
  scheduleDays: number,
  postponementCount: number,
): string | null {
  const avg = Math.round(analysis.actualAverageInterval);
  const hasAvg = avg > 0;

  // Frequent postponements are the strongest signal
  if (postponementCount >= 3) {
    if (analysis.suggestedAdjustment && analysis.suggestedAdjustment > scheduleDays) {
      return `Postponed ${postponementCount} times — try extending the schedule to every ${analysis.suggestedAdjustment} days`;
    }
    return `Postponed ${postponementCount} times — the every-${scheduleDays}-day schedule may be too frequent`;
  }

  // Schedule mismatch — user consistently waters on a different cadence
  if (hasAvg && analysis.suggestedAdjustment && analysis.suggestedAdjustment !== scheduleDays) {
    const direction = analysis.suggestedAdjustment > scheduleDays ? 'extending' : 'shortening';
    return `You water every ~${avg} days — consider ${direction} the schedule to ${analysis.suggestedAdjustment} days`;
  }

  // Pattern-based guidance
  if (analysis.pattern === 'irregular') {
    if (hasAvg) {
      return `Watering varies a lot (~${avg}-day avg vs ${scheduleDays}-day schedule) — try picking a consistent day`;
    }
    return `Not enough waterings on record — try to stick to the ${scheduleDays}-day schedule`;
  }

  if (analysis.pattern === 'late') {
    if (hasAvg && avg > scheduleDays) {
      return `Usually watered every ~${avg} days instead of ${scheduleDays} — the schedule may need extending`;
    }
    return `Waterings tend to run late — try setting a reminder for every ${scheduleDays} days`;
  }

  if (analysis.pattern === 'early') {
    if (hasAvg && avg < scheduleDays) {
      return `Watered every ~${avg} days — check soil before watering to avoid overdoing it`;
    }
    return 'Tends to be watered early — check soil moisture before watering';
  }

  if (analysis.pattern === 'consistent') {
    return 'On track — keep it up!';
  }

  return null;
}

/**
 * Compute average interval from raw watering records (sorted most-recent-first).
 * Only considers intervals between 1 and 90 days.
 */
export function computeAvgInterval(
  records: { watered_at: string }[],
): { avgInterval: number; totalWaterings: number } {
  if (records.length < 2) {
    return { avgInterval: 0, totalWaterings: records.length };
  }

  const intervals: number[] = [];
  for (let i = 0; i < records.length - 1; i++) {
    const current = new Date(records[i].watered_at).getTime();
    const previous = new Date(records[i + 1].watered_at).getTime();
    const days = (current - previous) / (1000 * 60 * 60 * 24);
    if (days >= 1 && days <= 90) {
      intervals.push(days);
    }
  }

  if (intervals.length === 0) {
    return { avgInterval: 0, totalWaterings: records.length };
  }

  const avg = intervals.reduce((s, d) => s + d, 0) / intervals.length;
  return {
    avgInterval: Math.round(avg * 10) / 10,
    totalWaterings: records.length,
  };
}

/**
 * Merge base PlantPerformance entries with pattern-analysis, postponement,
 * and raw watering-record data to produce fully enriched rows.
 *
 * Care scores are computed from the raw 90-day watering records — not from
 * the pattern analyzer's narrower window — so plants with plenty of history
 * always get a real score.
 */
export function mergePerformanceWithAnalysis(
  basePlants: PlantPerformance[],
  analysisMap: Map<string, WateringPatternAnalysis>,
  postponementMap: Map<string, PostponementRecord[]>,
  wateringRecordsMap: Map<string, { watered_at: string }[]>,
): PlantPerformance[] {
  return basePlants.map(plant => {
    const analysis = analysisMap.get(plant.plantId);
    const postponements = postponementMap.get(plant.plantId) || [];
    const postponementCount = postponements.length;
    const records = wateringRecordsMap.get(plant.plantId) || [];

    // Compute care score from raw watering records (90-day window, no seasonal clip)
    const { avgInterval, totalWaterings } = computeAvgInterval(records);
    const hasScoreData = avgInterval > 0;

    const patternFromAnalysis = analysis?.actualAverageInterval
      ? analysis.pattern
      : undefined;

    const careScore = hasScoreData
      ? calculateCareScore(
          avgInterval,
          plant.scheduleDays,
          patternFromAnalysis ?? 'irregular',
          postponementCount,
        )
      : -1;

    return {
      ...plant,
      careScore,
      pattern: patternFromAnalysis ?? (hasScoreData ? 'irregular' as const : 'insufficient' as const),
      avgInterval,
      postponementCount,
      totalWaterings: Math.max(plant.totalWaterings, totalWaterings),
      tip: analysis && analysis.actualAverageInterval > 0
        ? generateTip(analysis, plant.scheduleDays, postponementCount)
        : hasScoreData
          ? `Avg ~${Math.round(avgInterval)} days between waterings vs ${plant.scheduleDays}-day schedule`
          : null,
    };
  }).sort((a, b) => {
    if (a.careScore === -1 && b.careScore !== -1) return 1;
    if (a.careScore !== -1 && b.careScore === -1) return -1;
    return b.careScore - a.careScore;
  });
}

/**
 * Get time distribution of waterings by day of week.
 *
 * When allRecords is provided (from the 90-day bulk query), uses the full
 * history for an accurate picture. Falls back to latest_watering per plant
 * if records aren't available yet.
 */
export function getTimeDistribution(
  plants: UserPlant[],
  allRecords?: Map<string, { watered_at: string }[]>,
): TimeDistribution[] {
  const distribution: Record<string, number> = {};

  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
    distribution[day] = 0;
  });

  if (allRecords && allRecords.size > 0) {
    // Use full watering history
    for (const records of allRecords.values()) {
      for (const record of records) {
        const day = format(new Date(record.watered_at), 'EEEE');
        if (distribution.hasOwnProperty(day)) {
          distribution[day]++;
        }
      }
    }
  } else {
    // Fallback: latest watering per plant
    plants.forEach(plant => {
      if (plant.latest_watering) {
        const day = format(new Date(plant.latest_watering), 'EEEE');
        if (distribution.hasOwnProperty(day)) {
          distribution[day]++;
        }
      }
    });
  }

  return Object.entries(distribution).map(([period, waterings]) => ({
    period,
    waterings,
  }));
}

/**
 * Calculate current watering streak (consecutive days with waterings)
 */
function calculateCurrentStreak(plants: UserPlant[]): number {
  // Simplified - just check if any plant was watered in last 2 days
  const hasRecentWatering = plants.some(plant => {
    if (!plant.latest_watering) return false;
    const daysSince = differenceInDays(new Date(), new Date(plant.latest_watering));
    return daysSince <= 2;
  });

  return hasRecentWatering ? 1 : 0;
}

/**
 * Get summary insights based on analytics data
 */
export function getAnalyticsInsights(
  plants: UserPlant[],
  enrichedPerformance?: PlantPerformance[],
): Insight[] {
  const insights: Insight[] = [];
  const healthStats = calculatePlantHealthStats(plants);

  // Overdue — name the plants
  const overduePlants = plants.filter(p => {
    const daysSince = p.days_since_watering || 0;
    const schedule = p.suggested_watering_days || 7;
    return daysSince > schedule;
  });
  if (overduePlants.length > 0) {
    const names = overduePlants.slice(0, 3).map(p => p.nickname);
    const suffix = overduePlants.length > 3
      ? ` and ${overduePlants.length - 3} more`
      : '';
    insights.push({ names: names.join(', ') + suffix, message: 'overdue for watering' });
  }

  // Overwatering risk — name the plants
  const overwateredPlants = plants.filter(p => {
    const daysSince = p.days_since_watering || 0;
    const schedule = p.suggested_watering_days || 7;
    return daysSince < schedule * 0.3;
  });
  if (overwateredPlants.length > 0) {
    const names = overwateredPlants.slice(0, 3).map(p => p.nickname);
    insights.push({ names: names.join(', '), message: 'watered recently, check soil before watering again' });
  }

  // Postponement insights from enriched data
  if (enrichedPerformance) {
    const frequentPostponers = enrichedPerformance
      .filter(p => p.postponementCount >= 3)
      .sort((a, b) => b.postponementCount - a.postponementCount);

    for (const plant of frequentPostponers.slice(0, 2)) {
      insights.push({
        names: plant.plantName,
        message: `postponed ${plant.postponementCount} times — consider adjusting its schedule`,
      });
    }

    // Low care score — name the worst offenders
    const lowScorePlants = enrichedPerformance
      .filter(p => p.careScore >= 0 && p.careScore < 50)
      .sort((a, b) => a.careScore - b.careScore);
    if (lowScorePlants.length > 0 && frequentPostponers.length === 0) {
      const names = lowScorePlants.slice(0, 3).map(p => p.plantName);
      insights.push({ names: names.join(', '), message: 'low care scores, schedules may need adjusting' });
    }

    // Positive reinforcement — name the best performers
    const highScorePlants = enrichedPerformance.filter(
      p => p.careScore >= 75 && p.pattern === 'consistent'
    );
    if (highScorePlants.length > 0) {
      const names = highScorePlants.slice(0, 3).map(p => p.plantName);
      insights.push({ names: names.join(', '), message: 'on track, keep it up!' });
    }
  }

  // Overall performance
  if (healthStats.totalPlants > 0) {
    const compliance = healthStats.onSchedule / healthStats.totalPlants;
    if (compliance >= 0.8) {
      insights.push({ names: '', message: 'Most of your plants are on schedule' });
    }
  }

  if (insights.length === 0) {
    insights.push({ names: '', message: 'Your plants are doing well! Keep up the good work.' });
  }

  return insights;
}
