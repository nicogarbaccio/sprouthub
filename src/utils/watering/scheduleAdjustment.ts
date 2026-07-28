/**
 * Canonical seasonal and weather schedule adjustment.
 *
 * This module is the SINGLE source of truth for "what interval should this plant be on given
 * the season and the weather?".
 *
 * ## Why percentages rather than flat days
 *
 * Adjustments are expressed as a fraction of the plant's current interval. Flat day offsets
 * break down at the extremes of the range the app supports: a −2 day summer offset is a 66%
 * change to a 3-day fern and a 3% change to a 60-day cactus. Percentages scale with the
 * plant, which is also how the underlying biology behaves.
 *
 * The three previous implementations disagreed:
 *   - `calendarSeasonalService.getSeasonalAdjustment` — percentage, clamp 1–90
 *   - `scheduleVersioningService.calculateWeatherBasedSchedule` — flat days, then clamp 1–21
 *   - `smartSchedule` seasonal block — flat days, clamp 2–45
 *
 * ## How factors combine
 *
 * Every factor's day delta is computed from the SAME base interval and the deltas are summed.
 * Applying percentages sequentially would compound them (a −25% then a −15% is −36%, not
 * −40%), which is harder to explain to a user and makes the contribution of each factor
 * depend on evaluation order. Summing keeps each factor independently attributable, which
 * Requirement 5.3 needs.
 *
 * The 2–90 clamp is applied exactly once, at the end.
 */

import type { Season } from '@/utils/season';
import type { WeatherData } from '@/services/weatherTypes';
import { clampWateringInterval } from './bounds';
import { formatTemperature } from '@/utils/weather/temperature';

// ---------------------------------------------------------------------------
// Seasonal model
// ---------------------------------------------------------------------------

/**
 * Base seasonal rates, as a fraction of the current interval.
 * Negative shortens the interval (water more often); positive lengthens it.
 */
const SEASONAL_BASE_RATES: Record<Season, number> = {
    spring: -0.15, // active growth beginning
    summer: -0.25, // peak evapotranspiration
    fall: 0.15,    // growth slowing
    winter: 0.25,  // dormancy, reduced light
};

const SEASONAL_REASONING: Record<Season, string> = {
    spring: 'Spring brings active growth and warmer temperatures, requiring more frequent watering',
    summer: 'Summer heat and longer days increase water needs significantly',
    fall: 'Fall brings cooler temperatures and less evaporation, so soil stays moist longer',
    winter: 'Winter dormancy and reduced light mean plants need much less water',
};

/** Damping for drought-tolerant plants, whose needs shift less across seasons. */
const DROUGHT_TOLERANT_MULTIPLIER = 0.6;
/** Amplification for moisture-sensitive plants. */
const MOISTURE_SENSITIVE_MULTIPLIER = 1.2;
/** Amplification for outdoor plants, exposed to ambient conditions. */
const OUTDOOR_MULTIPLIER = 1.4;

function isDroughtTolerant(plantType: string): boolean {
    const t = plantType.toLowerCase();
    return t.includes('succulent') || t.includes('cactus') || t.includes('cacti');
}

function isMoistureSensitive(plantType: string): boolean {
    const t = plantType.toLowerCase();
    return t.includes('tropical') || t.includes('fern');
}

// ---------------------------------------------------------------------------
// Weather model
// ---------------------------------------------------------------------------

/**
 * Weather factor rates, also fractions of the current interval so they scale with the plant
 * the same way seasonal rates do. Values approximate the flat offsets the old implementation
 * used at a 7-day baseline, so typical plants see broadly similar behaviour.
 */
const WEATHER_RATES = {
    heat: -0.15,        // above HEAT_THRESHOLD_C
    cold: 0.25,         // below COLD_THRESHOLD_C
    veryDry: -0.15,     // below DRY_HUMIDITY_PCT
    veryHumid: 0.15,    // above HUMID_HUMIDITY_PCT
    shortDaylight: 0.15, // below SHORT_DAYLIGHT_HOURS
    longDaylight: -0.15, // above LONG_DAYLIGHT_HOURS
} as const;

const HEAT_THRESHOLD_C = 30;
const COLD_THRESHOLD_C = 5;
const DRY_HUMIDITY_PCT = 20;
const HUMID_HUMIDITY_PCT = 90;
const SHORT_DAYLIGHT_HOURS = 9;
const LONG_DAYLIGHT_HOURS = 15;

/**
 * Cap on the combined weather rate.
 *
 * Weather factors are summed, so without a cap a hot, bone-dry, long-daylight day would stack
 * to −45%. The cap lets two factors contribute meaningfully while preventing three from
 * running away.
 */
const MAX_COMBINED_WEATHER_RATE = 0.35;

/**
 * Weight applied to weather-derived adjustments for indoor plants.
 *
 * Outdoor readings are only a proxy for indoor conditions — heating and air conditioning
 * damp the relationship but do not remove it, since indoor temperature and humidity do track
 * outdoor weather seasonally. Halving the effect reflects that without discarding the signal.
 */
const INDOOR_WEATHER_WEIGHT = 0.5;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AdjustmentFactorKind = 'season' | 'temperature' | 'humidity' | 'daylight';

export interface AdjustmentFactor {
    kind: AdjustmentFactorKind;
    /** Rate as a fraction of the base interval, after all multipliers. */
    rate: number;
    /** Day delta this factor contributes, computed from the base interval. */
    days: number;
    /** User-facing explanation. */
    reason: string;
}

export interface ScheduleAdjustment {
    /** Interval the adjustment was computed from. */
    baseDays: number;
    /** Final suggested interval, clamped to 2–90. */
    suggestedDays: number;
    /** Net change in days, after clamping. */
    adjustmentDays: number;
    direction: 'increase' | 'decrease' | 'maintain';
    /** Each contributing factor, so the UI can explain the total. */
    factors: AdjustmentFactor[];
    /** Convenience: the reason strings from `factors`. */
    reasoning: string[];
    /** True when the clamp altered the raw computed value. */
    wasClamped: boolean;
}

export interface PlantAdjustmentContext {
    /** Current interval in days. */
    currentScheduleDays: number;
    /** Plant type or category, used for drought-tolerance and moisture-sensitivity damping. */
    plantType: string;
    isOutdoor: boolean;
}

// ---------------------------------------------------------------------------
// Seasonal adjustment
// ---------------------------------------------------------------------------

/**
 * The seasonal factor for a plant entering a given season.
 * Exported separately so callers can show the seasonal contribution on its own.
 */
export function getSeasonalFactor(
    context: PlantAdjustmentContext,
    season: Season
): AdjustmentFactor {
    let rate = SEASONAL_BASE_RATES[season];
    let reason = SEASONAL_REASONING[season];

    if (isDroughtTolerant(context.plantType)) {
        rate *= DROUGHT_TOLERANT_MULTIPLIER;
        reason += '. Drought-tolerant plants need smaller seasonal adjustments';
    } else if (isMoistureSensitive(context.plantType)) {
        rate *= MOISTURE_SENSITIVE_MULTIPLIER;
        reason += '. Tropical plants are more sensitive to seasonal changes';
    }

    if (context.isOutdoor) {
        rate *= OUTDOOR_MULTIPLIER;
        reason += '. Outdoor plants experience more dramatic seasonal changes';
    } else {
        reason += '. Indoor plants need gentler adjustments';
    }

    return {
        kind: 'season',
        rate,
        days: rateToDays(rate, context.currentScheduleDays),
        reason,
    };
}

/**
 * Converts a rate to a day delta, guaranteeing at least one day of movement when the rate is
 * non-zero. Without this, a −15% rate on a 3-day interval rounds to zero and the plant never
 * receives seasonal guidance at all.
 */
function rateToDays(rate: number, baseDays: number): number {
    if (rate === 0) return 0;
    const days = Math.round(baseDays * rate);
    if (days !== 0) return days;
    return rate < 0 ? -1 : 1;
}

// ---------------------------------------------------------------------------
// Weather adjustment
// ---------------------------------------------------------------------------

/**
 * All weather factors currently outside their normal range.
 *
 * Unlike the previous implementation, this does NOT return on the first match. At 32 °C with
 * 15% humidity the old code reported only the heat and silently dropped the dryness, and the
 * order in which conditions were checked (temperature before humidity) was arbitrary.
 */
export function getWeatherFactors(
    context: PlantAdjustmentContext,
    weather: WeatherData | null
): AdjustmentFactor[] {
    if (!weather) return [];

    const weight = context.isOutdoor ? 1 : INDOOR_WEATHER_WEIGHT;
    const raw: { kind: AdjustmentFactorKind; rate: number; reason: string }[] = [];

    const temp = weather.current_temp_celsius;
    const humidity = weather.current_humidity_percent;
    const daylight = weather.daylight_hours;

    // Temperature
    if (temp > HEAT_THRESHOLD_C) {
        raw.push({
            kind: 'temperature',
            rate: WEATHER_RATES.heat,
            // Deliberately describes the weather, not the plant's room. The previous copy said
            // "Hot indoor conditions" about an outdoor API reading.
            reason: `Hot weather (${formatTemperature(temp)}) increases plant water needs`,
        });
    } else if (temp < COLD_THRESHOLD_C) {
        raw.push({
            kind: 'temperature',
            rate: WEATHER_RATES.cold,
            reason: `Cold weather (${formatTemperature(temp)}) slows plant growth significantly`,
        });
    }

    // Humidity
    if (humidity < DRY_HUMIDITY_PCT) {
        raw.push({
            kind: 'humidity',
            rate: WEATHER_RATES.veryDry,
            reason: `Very dry air (${humidity}%) increases plant water loss`,
        });
    } else if (humidity > HUMID_HUMIDITY_PCT) {
        raw.push({
            kind: 'humidity',
            rate: WEATHER_RATES.veryHumid,
            reason: `High humidity (${humidity}%) means plants need less water`,
        });
    }

    // Daylight
    if (typeof daylight === 'number') {
        if (daylight < SHORT_DAYLIGHT_HOURS) {
            raw.push({
                kind: 'daylight',
                rate: WEATHER_RATES.shortDaylight,
                reason: `Short days (${daylight}h) mean less light and reduced water needs`,
            });
        } else if (daylight > LONG_DAYLIGHT_HOURS) {
            raw.push({
                kind: 'daylight',
                rate: WEATHER_RATES.longDaylight,
                reason: `Long days (${daylight}h) provide more light and increase water use`,
            });
        }
    }

    if (raw.length === 0) return [];

    // Bound the combined rate, scaling factors proportionally so their relative weight is
    // preserved and each remains individually attributable.
    const weighted = raw.map(f => ({ ...f, rate: f.rate * weight }));
    const total = weighted.reduce((sum, f) => sum + f.rate, 0);
    const scale =
        Math.abs(total) > MAX_COMBINED_WEATHER_RATE
            ? MAX_COMBINED_WEATHER_RATE / Math.abs(total)
            : 1;

    return weighted.map(f => {
        const rate = f.rate * scale;
        return {
            kind: f.kind,
            rate,
            days: Math.round(context.currentScheduleDays * rate),
            reason: f.reason,
        };
    });
}

// ---------------------------------------------------------------------------
// Combined adjustment
// ---------------------------------------------------------------------------

export interface AdjustmentOptions {
    /** Season to adjust for. Omit to compute a weather-only adjustment. */
    season?: Season;
    /** Current weather. Omit or pass null to compute a season-only adjustment. */
    weather?: WeatherData | null;
}

/**
 * Computes the suggested interval for a plant from its season and weather.
 *
 * All factor deltas are derived from the same base interval and summed, then the 2–90 clamp is
 * applied once. See the module header for why this is preferred over sequential application.
 */
export function calculateScheduleAdjustment(
    context: PlantAdjustmentContext,
    options: AdjustmentOptions = {}
): ScheduleAdjustment {
    const baseDays = context.currentScheduleDays;
    const factors: AdjustmentFactor[] = [];

    if (options.season) {
        factors.push(getSeasonalFactor(context, options.season));
    }

    factors.push(...getWeatherFactors(context, options.weather ?? null));

    const rawSuggested = baseDays + factors.reduce((sum, f) => sum + f.days, 0);
    const suggestedDays = clampWateringInterval(rawSuggested);
    const adjustmentDays = suggestedDays - baseDays;

    return {
        baseDays,
        suggestedDays,
        adjustmentDays,
        direction:
            adjustmentDays < 0 ? 'decrease' : adjustmentDays > 0 ? 'increase' : 'maintain',
        factors,
        reasoning: factors.map(f => f.reason),
        wasClamped: suggestedDays !== Math.round(rawSuggested),
    };
}
