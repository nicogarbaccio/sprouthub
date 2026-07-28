/**
 * Tests for the canonical seasonal and weather schedule adjustment model.
 *
 * These cover the two properties that the three previous implementations got wrong:
 * proportional scaling across the full interval range, and composing weather factors.
 */

import { describe, it, expect } from 'vitest';
import {
    calculateScheduleAdjustment,
    getSeasonalFactor,
    getWeatherFactors,
    type PlantAdjustmentContext,
} from '../watering/scheduleAdjustment';
import {
    MIN_WATERING_DAYS,
    MAX_WATERING_DAYS,
    clampWateringInterval,
} from '../watering/bounds';
import type { WeatherData } from '@/services/weatherTypes';

function context(overrides: Partial<PlantAdjustmentContext> = {}): PlantAdjustmentContext {
    return {
        currentScheduleDays: 7,
        plantType: 'Monstera',
        isOutdoor: false,
        ...overrides,
    };
}

function weather(overrides: Partial<WeatherData> = {}): WeatherData {
    return {
        current_temp_celsius: 20,
        current_humidity_percent: 50,
        season: 'summer',
        daylight_hours: 12,
        upcoming_rain_probability: 10,
        is_snowing: false,
        weather_condition: 'Clear',
        ...overrides,
    };
}

describe('getSeasonalFactor', () => {
    it('shortens the interval in summer and lengthens it in winter', () => {
        const summer = getSeasonalFactor(context(), 'summer');
        const winter = getSeasonalFactor(context(), 'winter');

        expect(summer.days).toBeLessThan(0);
        expect(winter.days).toBeGreaterThan(0);
    });

    it('scales proportionally with the interval', () => {
        // The core reason for choosing percentages: a short-interval and a long-interval plant
        // must receive proportionally comparable adjustments, not identical day offsets.
        const shortPlant = getSeasonalFactor(context({ currentScheduleDays: 4 }), 'winter');
        const longPlant = getSeasonalFactor(context({ currentScheduleDays: 60 }), 'winter');

        expect(Math.abs(longPlant.days)).toBeGreaterThan(Math.abs(shortPlant.days) * 5);

        // Both land near the same fraction of their own interval.
        expect(shortPlant.rate).toBeCloseTo(longPlant.rate, 5);
    });

    it('guarantees at least one day of movement on short intervals', () => {
        // A -15% rate on a 3-day interval rounds to zero. Without a floor the plant would never
        // receive seasonal guidance at all.
        const factor = getSeasonalFactor(context({ currentScheduleDays: 3 }), 'spring');

        expect(factor.days).toBe(-1);
    });

    it('damps the adjustment for drought-tolerant plants', () => {
        const cactus = getSeasonalFactor(context({ plantType: 'Barrel Cactus' }), 'winter');
        const typical = getSeasonalFactor(context({ plantType: 'Monstera' }), 'winter');

        expect(Math.abs(cactus.rate)).toBeLessThan(Math.abs(typical.rate));
    });

    it('amplifies the adjustment for moisture-sensitive plants', () => {
        const fern = getSeasonalFactor(context({ plantType: 'Boston Fern' }), 'winter');
        const typical = getSeasonalFactor(context({ plantType: 'Monstera' }), 'winter');

        expect(Math.abs(fern.rate)).toBeGreaterThan(Math.abs(typical.rate));
    });

    it('amplifies the adjustment for outdoor plants', () => {
        const outdoor = getSeasonalFactor(context({ isOutdoor: true }), 'winter');
        const indoor = getSeasonalFactor(context({ isOutdoor: false }), 'winter');

        expect(Math.abs(outdoor.rate)).toBeGreaterThan(Math.abs(indoor.rate));
    });
});

describe('getWeatherFactors', () => {
    it('returns nothing when conditions are normal', () => {
        expect(getWeatherFactors(context(), weather())).toHaveLength(0);
    });

    it('returns nothing when there is no weather data', () => {
        expect(getWeatherFactors(context(), null)).toHaveLength(0);
    });

    it('composes simultaneous out-of-range conditions', () => {
        // Regression: the old implementation early-returned, so a hot AND very dry day reported
        // only the heat and silently dropped the dryness.
        const factors = getWeatherFactors(
            context({ isOutdoor: true }),
            weather({ current_temp_celsius: 32, current_humidity_percent: 15 })
        );

        const kinds = factors.map(f => f.kind);
        expect(kinds).toContain('temperature');
        expect(kinds).toContain('humidity');
    });

    it('composes three factors at once', () => {
        const factors = getWeatherFactors(
            context({ isOutdoor: true }),
            weather({
                current_temp_celsius: 32,
                current_humidity_percent: 15,
                daylight_hours: 16,
            })
        );

        expect(factors).toHaveLength(3);
        // All three push toward more frequent watering.
        expect(factors.every(f => f.rate < 0)).toBe(true);
    });

    it('bounds the combined weather rate', () => {
        const factors = getWeatherFactors(
            context({ isOutdoor: true }),
            weather({
                current_temp_celsius: 32,
                current_humidity_percent: 15,
                daylight_hours: 16,
            })
        );

        const total = Math.abs(factors.reduce((sum, f) => sum + f.rate, 0));

        // Unbounded this would be 45%.
        expect(total).toBeLessThanOrEqual(0.35 + 1e-9);
    });

    it('applies weather at reduced weight for indoor plants', () => {
        const hot = weather({ current_temp_celsius: 32 });

        const outdoor = getWeatherFactors(context({ isOutdoor: true }), hot);
        const indoor = getWeatherFactors(context({ isOutdoor: false }), hot);

        expect(Math.abs(indoor[0].rate)).toBeLessThan(Math.abs(outdoor[0].rate));
    });

    it('does not claim knowledge of indoor conditions in its copy', () => {
        const factors = getWeatherFactors(
            context(),
            weather({ current_temp_celsius: 32, current_humidity_percent: 15 })
        );

        for (const factor of factors) {
            expect(factor.reason.toLowerCase()).not.toContain('indoor');
        }
    });

    it('lengthens the interval in cold and humid conditions', () => {
        const factors = getWeatherFactors(
            context({ isOutdoor: true }),
            weather({ current_temp_celsius: 2, current_humidity_percent: 95 })
        );

        expect(factors.every(f => f.rate > 0)).toBe(true);
    });
});

describe('clampWateringInterval', () => {
    it('holds at the lower bound', () => {
        expect(clampWateringInterval(0)).toBe(MIN_WATERING_DAYS);
        expect(clampWateringInterval(-5)).toBe(MIN_WATERING_DAYS);
        expect(clampWateringInterval(1)).toBe(MIN_WATERING_DAYS);
    });

    it('holds at the upper bound', () => {
        expect(clampWateringInterval(120)).toBe(MAX_WATERING_DAYS);
        expect(clampWateringInterval(91)).toBe(MAX_WATERING_DAYS);
    });

    it('leaves in-range values alone', () => {
        expect(clampWateringInterval(7)).toBe(7);
        expect(clampWateringInterval(MAX_WATERING_DAYS)).toBe(MAX_WATERING_DAYS);
    });
});

describe('calculateScheduleAdjustment', () => {
    it('sums seasonal and weather deltas from the same base interval', () => {
        const ctx = context({ currentScheduleDays: 20, isOutdoor: true });

        const seasonOnly = calculateScheduleAdjustment(ctx, { season: 'winter' });
        const combined = calculateScheduleAdjustment(ctx, {
            season: 'winter',
            weather: weather({ current_temp_celsius: 2 }),
        });

        // Cold weather pushes the same direction as winter, so the combined result extends further.
        expect(combined.suggestedDays).toBeGreaterThan(seasonOnly.suggestedDays);
    });

    it('reports the base interval, each factor, and the final interval', () => {
        const result = calculateScheduleAdjustment(context({ currentScheduleDays: 14 }), {
            season: 'summer',
            weather: weather({ current_temp_celsius: 32 }),
        });

        expect(result.baseDays).toBe(14);
        expect(result.factors.length).toBeGreaterThanOrEqual(2);
        expect(result.reasoning.length).toBe(result.factors.length);
        expect(result.suggestedDays).toBe(14 + result.adjustmentDays);
    });

    it('lets a long-interval plant be extended past the old 45-day ceiling', () => {
        // Lithops ships at exactly 45 days in the catalog. Under the previous 2-45 clamp its
        // winter suggestion was clamped straight back to 45, so the app could never advise
        // reducing winter watering for its most overwatering-sensitive plant.
        const result = calculateScheduleAdjustment(
            context({ currentScheduleDays: 45, plantType: 'Lithops succulent' }),
            { season: 'winter' }
        );

        expect(result.suggestedDays).toBeGreaterThan(45);
        expect(result.suggestedDays).toBeLessThanOrEqual(MAX_WATERING_DAYS);
        expect(result.direction).toBe('increase');
    });

    it('clamps only once, at the end', () => {
        const result = calculateScheduleAdjustment(
            context({ currentScheduleDays: MAX_WATERING_DAYS, isOutdoor: true }),
            { season: 'winter', weather: weather({ current_temp_celsius: 2 }) }
        );

        expect(result.suggestedDays).toBe(MAX_WATERING_DAYS);
        expect(result.wasClamped).toBe(true);
    });

    it('reports maintain when nothing changes', () => {
        const result = calculateScheduleAdjustment(context(), {});

        expect(result.adjustmentDays).toBe(0);
        expect(result.direction).toBe('maintain');
        expect(result.factors).toHaveLength(0);
    });

    it('never suggests an interval outside the bounds', () => {
        const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
        const intervals = [2, 3, 7, 21, 45, 90];

        for (const season of seasons) {
            for (const days of intervals) {
                for (const isOutdoor of [true, false]) {
                    const result = calculateScheduleAdjustment(
                        context({ currentScheduleDays: days, isOutdoor }),
                        { season, weather: weather({ current_temp_celsius: 35 }) }
                    );

                    expect(result.suggestedDays).toBeGreaterThanOrEqual(MIN_WATERING_DAYS);
                    expect(result.suggestedDays).toBeLessThanOrEqual(MAX_WATERING_DAYS);
                }
            }
        }
    });
});

describe('no regression for typical northern indoor plants', () => {
    it('keeps seasonal suggestions within a day of the previous percentage model', () => {
        // The previous percentage path used the same base rates and multipliers, so a typical
        // indoor plant should be unchanged. Expected values computed from those rates:
        //   7 days, indoor, no plant-type modifier
        const expected: Record<string, number> = {
            spring: -1, // round(7 * -0.15) = -1
            summer: -2, // round(7 * -0.25) = -2
            fall: 1,    // round(7 * 0.15)  = 1
            winter: 2,  // round(7 * 0.25)  = 2
        };

        for (const [season, days] of Object.entries(expected)) {
            const factor = getSeasonalFactor(
                context({ currentScheduleDays: 7 }),
                season as 'spring' | 'summer' | 'fall' | 'winter'
            );
            expect(Math.abs(factor.days - days)).toBeLessThanOrEqual(1);
        }
    });
});
