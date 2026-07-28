import { describe, it, expect } from 'vitest';
import { calculateSmartWateringSchedule, type WateringFactors } from '../watering/smartSchedule';
import { getSeasonalFactor } from '../watering/scheduleAdjustment';
import { MIN_WATERING_DAYS } from '../watering/bounds';

/**
 * These tests previously asserted hardcoded totals against a spring baseline that produced no
 * seasonal adjustment. That baseline no longer exists: the wizard now delegates its seasonal
 * component to the canonical percentage model, under which every season moves the interval.
 * The wizard used to be the odd one out — it treated spring as neutral while the seasonal
 * banner applied -15% for the same plant on the same day.
 *
 * Environmental factors (size, light, temperature, humidity, care style, soil) are still flat
 * day offsets, because they describe the plant's fixed setting rather than a seasonal or
 * weather condition. Those assertions are expressed relative to a computed baseline so they
 * stay meaningful if the seasonal rates are ever retuned.
 */

const BASE_DAYS = 7;

const baseFactors: WateringFactors = {
  plantSize: 'medium',
  lightLevel: 'medium',
  temperature: 'normal',
  humidity: 'normal',
  season: 'spring',
  careStyle: 'balanced',
  soilType: 'regular',
};

/** Seasonal day delta the wizard will apply for a given season at BASE_DAYS. */
function seasonalDelta(season: WateringFactors['season'], baseDays = BASE_DAYS): number {
  return getSeasonalFactor(
    { currentScheduleDays: baseDays, plantType: '', isOutdoor: false },
    season
  ).days;
}

/** Result for the all-neutral environmental case in a given season. */
function baseline(season: WateringFactors['season'] = 'spring') {
  return calculateSmartWateringSchedule(BASE_DAYS, { ...baseFactors, season });
}

describe('smartWateringSchedule', () => {
  describe('seasonal component', () => {
    it('applies the canonical seasonal adjustment rather than a flat offset table', () => {
      for (const season of ['spring', 'summer', 'fall', 'winter'] as const) {
        const result = calculateSmartWateringSchedule(BASE_DAYS, { ...baseFactors, season });

        expect(result.totalAdjustment).toBe(seasonalDelta(season));
        expect(result.recommendedDays).toBe(BASE_DAYS + seasonalDelta(season));
      }
    });

    it('shortens the interval in the growing season and lengthens it in dormancy', () => {
      expect(baseline('summer').recommendedDays).toBeLessThan(BASE_DAYS);
      expect(baseline('spring').recommendedDays).toBeLessThan(BASE_DAYS);
      expect(baseline('fall').recommendedDays).toBeGreaterThan(BASE_DAYS);
      expect(baseline('winter').recommendedDays).toBeGreaterThan(BASE_DAYS);
    });

    it('scales the seasonal component with the base interval', () => {
      // The whole point of the percentage model: a long-interval plant moves further in
      // absolute days than a short-interval one.
      const short = calculateSmartWateringSchedule(4, { ...baseFactors, season: 'winter' });
      const long = calculateSmartWateringSchedule(60, { ...baseFactors, season: 'winter' });

      expect(long.totalAdjustment).toBeGreaterThan(short.totalAdjustment);
    });

    it('applies plant-type damping when context is supplied', () => {
      const cactus = calculateSmartWateringSchedule(
        30,
        { ...baseFactors, season: 'winter' },
        { plantType: 'Barrel Cactus' }
      );
      const typical = calculateSmartWateringSchedule(
        30,
        { ...baseFactors, season: 'winter' },
        { plantType: 'Monstera' }
      );

      expect(cactus.totalAdjustment).toBeLessThan(typical.totalAdjustment);
    });

    it('always explains the seasonal contribution', () => {
      const result = baseline('winter');

      expect(result.adjustmentReasons.length).toBeGreaterThanOrEqual(1);
      expect(result.adjustmentReasons.some(r => r.toLowerCase().includes('winter'))).toBe(true);
    });
  });

  describe('environmental factors', () => {
    it('reports the base days it was given', () => {
      expect(baseline().baseDays).toBe(BASE_DAYS);
    });

    it('shortens the interval for small plants', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        plantSize: 'small',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays - 1);
      expect(result.adjustmentReasons).toContain(
        'Small plants have less soil volume and dry out faster'
      );
    });

    it('lengthens the interval for large plants', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        plantSize: 'large',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays + 2);
      expect(result.adjustmentReasons).toContain(
        'Large plants have more soil volume and retain moisture longer'
      );
    });

    it('shortens the interval for high light', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        lightLevel: 'high',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays - 1);
      expect(result.adjustmentReasons).toContain(
        'High light increases photosynthesis and water evaporation'
      );
    });

    it('lengthens the interval for low light', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        lightLevel: 'low',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays + 1);
      expect(result.adjustmentReasons).toContain(
        'Low light reduces plant metabolism and water consumption'
      );
    });

    it('shortens the interval for warm temperature', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        temperature: 'warm',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays - 1);
      expect(result.adjustmentReasons).toContain('Warm temperatures increase evaporation rate');
    });

    it('lengthens the interval for cool temperature', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        temperature: 'cool',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays + 1);
      expect(result.adjustmentReasons).toContain('Cool temperatures slow down water evaporation');
    });

    it('shortens the interval substantially for dry air', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        humidity: 'dry',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays - 2);
      expect(result.adjustmentReasons).toContain(
        'Dry air increases water loss through transpiration'
      );
    });

    it('lengthens the interval for humid conditions', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        humidity: 'humid',
      });

      expect(result.recommendedDays).toBe(baseline().recommendedDays + 1);
      expect(result.adjustmentReasons).toContain('High humidity reduces water loss');
    });

    it('shortens the interval for draining soil', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        soilType: 'draining',
      });

      expect(result.recommendedDays).toBeLessThan(baseline().recommendedDays);
    });

    it('lengthens the interval for retaining soil', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        soilType: 'retaining',
      });

      expect(result.recommendedDays).toBeGreaterThan(baseline().recommendedDays);
    });

    it('shortens the interval for a frequent care style', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        careStyle: 'frequent',
      });

      expect(result.recommendedDays).toBeLessThan(baseline().recommendedDays);
    });

    it('lengthens the interval for a minimal care style', () => {
      const result = calculateSmartWateringSchedule(BASE_DAYS, {
        ...baseFactors,
        careStyle: 'minimal',
      });

      expect(result.recommendedDays).toBeGreaterThan(baseline().recommendedDays);
    });
  });

  describe('composition and bounds', () => {
    it('combines every contributing factor', () => {
      const factors: WateringFactors = {
        plantSize: 'small', // -1
        lightLevel: 'high', // -1
        temperature: 'warm', // -1
        humidity: 'dry', // -2
        season: 'summer', // percentage-based
        careStyle: 'balanced',
        soilType: 'regular',
      };

      const result = calculateSmartWateringSchedule(BASE_DAYS, factors);

      expect(result.totalAdjustment).toBe(-5 + seasonalDelta('summer'));
      // Four environmental reasons plus the seasonal one.
      expect(result.adjustmentReasons).toHaveLength(5);
    });

    it('enforces the shared minimum interval', () => {
      const factors: WateringFactors = {
        plantSize: 'small',
        lightLevel: 'high',
        temperature: 'warm',
        humidity: 'dry',
        season: 'summer',
        careStyle: 'frequent',
        soilType: 'draining',
      };

      const result = calculateSmartWateringSchedule(3, factors);

      expect(result.recommendedDays).toBe(MIN_WATERING_DAYS);
    });

    it('allows a long interval to exceed the retired 45-day ceiling', () => {
      // The wizard used to clamp at 45, contradicting both pattern analysis and the catalog.
      const result = calculateSmartWateringSchedule(60, {
        ...baseFactors,
        season: 'winter',
        soilType: 'retaining',
      });

      expect(result.recommendedDays).toBeGreaterThan(45);
    });

    it('provides a confidence level', () => {
      const result = baseline();

      expect(['low', 'medium', 'high']).toContain(result.confidence);
    });
  });
});
