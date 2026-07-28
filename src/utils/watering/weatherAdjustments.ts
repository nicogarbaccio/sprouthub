/**
 * Weather-based schedule adjustment.
 *
 * This is now a thin adapter over the canonical model in `./scheduleAdjustment`. It exists to
 * keep the existing call shape (base days in, adjusted days out) while the underlying
 * behaviour changed in two ways:
 *
 *   1. Factors compose. Previously `getExtremeWeatherAdjustment` early-returned, so only the
 *      first out-of-range condition counted and the check order decided which one won.
 *   2. Adjustments scale with the plant's interval instead of being flat day offsets, and the
 *      combined effect is bounded.
 */

import { WeatherData } from '@/services/weatherTypes';
import {
  calculateScheduleAdjustment,
  getWeatherFactors,
  type AdjustmentFactor,
} from './scheduleAdjustment';
import { clampWateringInterval } from './bounds';

export interface WeatherAdjustmentResult {
  adjustmentDays: number;
  reasons: string[];
  hasExtremeConditions: boolean;
  /** Individual contributing factors, so callers can explain the total. */
  factors: AdjustmentFactor[];
}

export interface WeatherAdjustmentContext {
  /** Weather affects outdoor plants more directly than indoor ones. */
  isOutdoor?: boolean;
  /** Plant type, used only for consistency with the shared context shape. */
  plantType?: string;
}

/**
 * Calculate weather-based adjustments to a watering schedule.
 *
 * @param weatherData - current weather, or null for no adjustment
 * @param baseScheduleDays - the plant's current interval, which adjustments scale against
 * @param context - plant characteristics affecting how strongly weather applies
 */
export function calculateWeatherScheduleAdjustments(
  weatherData: WeatherData | null,
  baseScheduleDays: number,
  context: WeatherAdjustmentContext = {}
): WeatherAdjustmentResult {
  if (!weatherData) {
    return {
      adjustmentDays: 0,
      reasons: [],
      hasExtremeConditions: false,
      factors: [],
    };
  }

  const factors = getWeatherFactors(
    {
      currentScheduleDays: baseScheduleDays,
      plantType: context.plantType ?? '',
      isOutdoor: context.isOutdoor ?? false,
    },
    weatherData
  );

  return {
    adjustmentDays: factors.reduce((sum, f) => sum + f.days, 0),
    reasons: factors.map(f => f.reason),
    // Temperature and humidity factors only fire outside their extreme thresholds; a daylight
    // factor alone is a normal seasonal signal rather than an extreme condition.
    hasExtremeConditions: factors.some(
      f => f.kind === 'temperature' || f.kind === 'humidity'
    ),
    factors,
  };
}

/**
 * Apply weather adjustments to a base schedule, clamped to the shared 2–90 day range.
 *
 * The previous signature accepted `minDays`/`maxDays` overrides defaulting to 2 and 45. Those
 * are gone deliberately: per-call-site bounds are how four different clamps ended up in the
 * codebase. Use `clampWateringInterval` if you need the bound directly.
 */
export function applyWeatherAdjustments(
  baseScheduleDays: number,
  weatherData: WeatherData | null,
  context: WeatherAdjustmentContext = {}
): number {
  const result = calculateScheduleAdjustment(
    {
      currentScheduleDays: baseScheduleDays,
      plantType: context.plantType ?? '',
      isOutdoor: context.isOutdoor ?? false,
    },
    { weather: weatherData }
  );

  return result.suggestedDays;
}

/**
 * Human-readable summary of weather's impact on a schedule.
 */
export function getWeatherAdjustmentSummary(
  weatherData: WeatherData | null,
  originalSchedule: number,
  adjustedSchedule: number
): string {
  if (!weatherData || originalSchedule === adjustedSchedule) {
    return '';
  }

  const diff = adjustedSchedule - originalSchedule;
  if (diff > 0) {
    return `Schedule extended by ${diff} day${diff !== 1 ? 's' : ''} due to current weather conditions`;
  }
  return `Schedule shortened by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} due to current weather conditions`;
}

export { clampWateringInterval };
