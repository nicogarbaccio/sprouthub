import { describe, it, expect } from 'vitest';
import { calculateSmartWateringSchedule, type WateringFactors } from '../smartWateringSchedule';

describe('smartWateringSchedule', () => {
  describe('calculateSmartWateringSchedule', () => {
    const baseFactors: WateringFactors = {
      plantSize: 'medium',
      lightLevel: 'medium',
      temperature: 'normal',
      humidity: 'normal',
      season: 'spring',
      careStyle: 'balanced',
      soilType: 'regular',
    };

    it('should return base days with no adjustments for baseline factors', () => {
      const result = calculateSmartWateringSchedule(7, baseFactors);

      expect(result.recommendedDays).toBe(7);
      expect(result.baseDays).toBe(7);
      expect(result.totalAdjustment).toBe(0);
      expect(result.adjustmentReasons).toHaveLength(0);
    });

    it('should decrease watering days for small plants', () => {
      const factors = { ...baseFactors, plantSize: 'small' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(6);
      expect(result.totalAdjustment).toBe(-1);
      expect(result.adjustmentReasons).toContain('Small plants have less soil volume and dry out faster');
    });

    it('should increase watering days for large plants', () => {
      const factors = { ...baseFactors, plantSize: 'large' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(9);
      expect(result.totalAdjustment).toBe(2);
      expect(result.adjustmentReasons).toContain('Large plants have more soil volume and retain moisture longer');
    });

    it('should decrease watering days for high light', () => {
      const factors = { ...baseFactors, lightLevel: 'high' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(6);
      expect(result.adjustmentReasons).toContain('High light increases photosynthesis and water evaporation');
    });

    it('should increase watering days for low light', () => {
      const factors = { ...baseFactors, lightLevel: 'low' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(8);
      expect(result.adjustmentReasons).toContain('Low light reduces plant metabolism and water consumption');
    });

    it('should decrease watering days for warm temperature', () => {
      const factors = { ...baseFactors, temperature: 'warm' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(6);
      expect(result.adjustmentReasons).toContain('Warm temperatures increase evaporation rate');
    });

    it('should increase watering days for cool temperature', () => {
      const factors = { ...baseFactors, temperature: 'cool' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(8);
      expect(result.adjustmentReasons).toContain('Cool temperatures slow down water evaporation');
    });

    it('should significantly decrease watering days for dry humidity', () => {
      const factors = { ...baseFactors, humidity: 'dry' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(5);
      expect(result.totalAdjustment).toBe(-2);
      expect(result.adjustmentReasons).toContain('Dry air increases water loss through transpiration');
    });

    it('should increase watering days for humid conditions', () => {
      const factors = { ...baseFactors, humidity: 'humid' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(8);
      expect(result.adjustmentReasons).toContain('High humidity reduces water loss');
    });

    it('should significantly increase watering days for winter', () => {
      const factors = { ...baseFactors, season: 'winter' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(10);
      expect(result.totalAdjustment).toBe(3);
      expect(result.adjustmentReasons).toContain('Winter dormancy significantly reduces water needs');
    });

    it('should decrease watering days for summer', () => {
      const factors = { ...baseFactors, season: 'summer' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBe(6);
      expect(result.adjustmentReasons).toContain('Summer growth phase increases water consumption');
    });

    it('should handle multiple adjustments correctly', () => {
      const factors: WateringFactors = {
        plantSize: 'small',      // -1
        lightLevel: 'high',      // -1
        temperature: 'warm',     // -1
        humidity: 'dry',         // -2
        season: 'summer',        // -1
        careStyle: 'balanced',
        soilType: 'regular',
      };

      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.totalAdjustment).toBe(-6);
      expect(result.recommendedDays).toBe(2); // Should enforce minimum of 2 days
      expect(result.adjustmentReasons).toHaveLength(5);
    });

    it('should enforce minimum watering schedule of 2 days', () => {
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

      expect(result.recommendedDays).toBeGreaterThanOrEqual(2);
    });

    it('should provide confidence levels', () => {
      const result = calculateSmartWateringSchedule(7, baseFactors);

      expect(result.confidence).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.confidence);
    });

    it('should handle draining soil appropriately', () => {
      const factors = { ...baseFactors, soilType: 'draining' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBeLessThan(7);
    });

    it('should handle retaining soil appropriately', () => {
      const factors = { ...baseFactors, soilType: 'retaining' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBeGreaterThan(7);
    });

    it('should handle frequent care style', () => {
      const factors = { ...baseFactors, careStyle: 'frequent' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBeLessThan(7);
    });

    it('should handle minimal care style', () => {
      const factors = { ...baseFactors, careStyle: 'minimal' as const };
      const result = calculateSmartWateringSchedule(7, factors);

      expect(result.recommendedDays).toBeGreaterThan(7);
    });
  });
});
