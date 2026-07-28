/**
 * Rain delay advice for outdoor plants.
 *
 * ## Advisory, not suppressive
 *
 * Rain delay never changes whether a plant is due. It annotates a due or overdue plant with
 * "rain is coming, you may want to wait" and offers a postponement.
 *
 * That is a deliberate limit. `WeatherData` carries `upcoming_rain_probability` with no
 * timing information — nothing tells us whether that rain is tonight or six days out.
 * Suppressing a reminder for up to three days on an untimed probability risks a plant going
 * unwatered with no nag at all if the rain misses.
 *
 * So there is exactly one mechanism that moves a plant's due date: postponement. Rain delay
 * is a reason to offer one. The previous `getAdjustedWateringSchedule` helper added delay days
 * straight onto the interval, creating a second, invisible deferral path that nothing else in
 * the app knew about; it has been removed rather than wired up.
 *
 * ## Due-awareness
 *
 * Advice is only produced for a plant that is actually due or overdue. The previous
 * implementation ignored due-ness entirely, so the (dead) bulk helper reported "delay
 * watering" for plants that had been watered the day before.
 */

import type { WeatherData } from '@/services/weatherTypes';
import {
  calculateWateringSchedule,
  type PlantWateringInfo,
} from './schedule';

/** Rain probability at or above which a delay is worth suggesting. */
export const RAIN_DELAY_THRESHOLD_PCT = 60;

/** Longest delay we will ever suggest. */
export const MAX_RAIN_DELAY_DAYS = 3;

export interface RainDelayAdvice {
  /** Forecast probability that triggered the advice. */
  rainProbability: number;
  /** How many days the watering could reasonably wait (1–3). */
  suggestedDelayDays: number;
  /** When to reconsider, i.e. now plus `suggestedDelayDays`. */
  nextCheckDate: Date;
  /** User-facing explanation. */
  reason: string;
  /** True when the forecast precipitation is snow rather than rain. */
  isSnowing: boolean;
}

export interface RainDelayOptions {
  rainThreshold?: number;
  maxDelayDays?: number;
}

/** The plant fields rain delay needs: watering schedule plus the outdoor flag. */
export interface RainDelayPlant extends PlantWateringInfo {
  is_outdoor_plant?: boolean | null;
}

export interface RainDelayParams {
  plant: RainDelayPlant;
  weather: WeatherData | null;
  /** False when the user has not enabled weather features. */
  enabled?: boolean;
  options?: RainDelayOptions;
  /** Evaluation time, for tests. */
  now?: Date;
}

/**
 * Rain delay advice for a single plant, or `null` when no delay should be suggested.
 *
 * Returns null unless all of the following hold:
 *   - weather features are enabled and weather data is available
 *   - the plant is outdoors (rain does not water an indoor plant)
 *   - the forecast precipitation probability meets the threshold
 *   - the plant is currently due or overdue
 */
export function getRainDelayAdvice({
  plant,
  weather,
  enabled = true,
  options = {},
  now = new Date(),
}: RainDelayParams): RainDelayAdvice | null {
  const {
    rainThreshold = RAIN_DELAY_THRESHOLD_PCT,
    maxDelayDays = MAX_RAIN_DELAY_DAYS,
  } = options;

  if (!enabled || !weather) return null;
  if (!plant.is_outdoor_plant) return null;

  const rainProbability = weather.upcoming_rain_probability;
  if (rainProbability < rainThreshold) return null;

  // Only meaningful for a plant that would otherwise be watered now.
  const schedule = calculateWateringSchedule(plant, { now });
  const isDueOrOverdue =
    !schedule.hasUnknownWateringDate &&
    !schedule.isPostponed &&
    (schedule.isOverdue || schedule.daysUntilWatering === 0);

  if (!isDueOrOverdue) return null;

  const suggestedDelayDays = Math.min(
    delayDaysForProbability(rainProbability),
    maxDelayDays
  );

  const nextCheckDate = new Date(now);
  nextCheckDate.setDate(nextCheckDate.getDate() + suggestedDelayDays);

  const precipitation = weather.is_snowing ? 'Snow' : 'Rain';

  return {
    rainProbability,
    suggestedDelayDays,
    nextCheckDate,
    reason: `${precipitation} expected (${rainProbability}% chance), so outdoor watering can wait`,
    isSnowing: Boolean(weather.is_snowing),
  };
}

/** Heavier forecast precipitation justifies a longer wait. */
function delayDaysForProbability(probability: number): number {
  if (probability >= 80) return 3;
  if (probability >= 70) return 2;
  return 1;
}

/**
 * Builds rain delay advice for a list of plants, keyed by plant id.
 * Plants with no advice are omitted, so the map doubles as a membership test.
 */
export function getRainDelayByPlantId<T extends RainDelayPlant & { id: string }>(
  plants: T[],
  params: Omit<RainDelayParams, 'plant'>
): Record<string, RainDelayAdvice> {
  const result: Record<string, RainDelayAdvice> = {};

  for (const plant of plants) {
    const advice = getRainDelayAdvice({ ...params, plant });
    if (advice) result[plant.id] = advice;
  }

  return result;
}

/**
 * Short user-facing sentence describing the advice.
 *
 * Deliberately phrased as a choice ("you may want to wait") rather than a statement of fact
 * ("watering can be skipped"). The plant is still due; the user is being offered a reason to
 * defer, and the Dashboard copy previously implied the reminder had been handled for them.
 */
export function getRainDelayMessage(
  advice: RainDelayAdvice,
  plantName?: string
): string {
  const subject = plantName ?? 'this outdoor plant';
  const days = advice.suggestedDelayDays;
  const dayText = days === 1 ? 'day' : 'days';
  const precipitation = advice.isSnowing ? 'snow' : 'rain';

  return `${subject} is due, but ${precipitation} is expected (${advice.rainProbability}%). You may want to wait ${days} ${dayText}.`;
}

/** Compact suffix for appending to an existing due/overdue message. */
export function getRainDelayAnnotation(advice: RainDelayAdvice): string {
  const precipitation = advice.isSnowing ? 'snow' : 'rain';
  return `${advice.rainProbability}% chance of ${precipitation} — you may want to wait`;
}
