import { WeatherData } from '@/services/weatherTypes';
import {
  getExtremeWeatherAdjustment,
  getDaylightAdjustment
} from './weatherMapping';

export interface WeatherAdjustmentResult {
  adjustmentDays: number;
  reasons: string[];
  hasExtremeConditions: boolean;
}

/**
 * Calculate comprehensive weather-based adjustments to watering schedule
 * Combines extreme weather and daylight adjustments
 *
 * @param weatherData - Current weather data
 * @param baseScheduleDays - Base watering schedule in days
 * @returns Adjustment result with recommended changes and explanations
 */
export function calculateWeatherScheduleAdjustments(
  weatherData: WeatherData | null,
  baseScheduleDays: number
): WeatherAdjustmentResult {
  if (!weatherData) {
    return {
      adjustmentDays: 0,
      reasons: [],
      hasExtremeConditions: false,
    };
  }

  let totalAdjustment = 0;
  const reasons: string[] = [];
  let hasExtremeConditions = false;

  // Check for extreme weather conditions
  const extremeWeather = getExtremeWeatherAdjustment(weatherData);
  if (extremeWeather.adjustment !== 0) {
    totalAdjustment += extremeWeather.adjustment;
    hasExtremeConditions = true;
    if (extremeWeather.reason) {
      reasons.push(extremeWeather.reason);
    }
  }

  // Check for daylight-based adjustments
  const daylightAdjustment = getDaylightAdjustment(weatherData);
  if (daylightAdjustment.adjustment !== 0) {
    totalAdjustment += daylightAdjustment.adjustment;
    if (daylightAdjustment.reason) {
      reasons.push(daylightAdjustment.reason);
    }
  }

  return {
    adjustmentDays: totalAdjustment,
    reasons,
    hasExtremeConditions,
  };
}

/**
 * Apply weather adjustments to a base watering schedule
 * Returns the adjusted schedule with bounds checking
 *
 * @param baseScheduleDays - Base watering schedule in days
 * @param weatherData - Current weather data
 * @param minDays - Minimum allowed schedule (default: 2)
 * @param maxDays - Maximum allowed schedule (default: 45)
 * @returns Adjusted schedule in days
 */
export function applyWeatherAdjustments(
  baseScheduleDays: number,
  weatherData: WeatherData | null,
  minDays: number = 2,
  maxDays: number = 45
): number {
  const adjustment = calculateWeatherScheduleAdjustments(weatherData, baseScheduleDays);
  const adjustedSchedule = baseScheduleDays + adjustment.adjustmentDays;

  // Apply bounds
  return Math.max(minDays, Math.min(maxDays, adjustedSchedule));
}

/**
 * Get a summary of weather impact on watering schedule
 * Useful for displaying to users
 *
 * @param weatherData - Current weather data
 * @param originalSchedule - Original schedule in days
 * @param adjustedSchedule - Adjusted schedule in days
 * @returns Human-readable summary
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
  const adjustment = calculateWeatherScheduleAdjustments(weatherData, originalSchedule);

  if (diff > 0) {
    return `Schedule extended by ${diff} day${diff !== 1 ? 's' : ''} due to current weather conditions`;
  } else if (diff < 0) {
    return `Schedule shortened by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} due to current weather conditions`;
  }

  return '';
}
