import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
 calculateSmartWateringSchedule, 
 getCurrentSeason, 
 getFactorLabels,
 type WateringFactors 
} from '../smartWateringSchedule';

describe('calculateSmartWateringSchedule', () => {
 // Baseline factors for testing
 const baselineFactors: WateringFactors = {
 plantSize: 'medium',
 lightLevel: 'medium',
 temperature: 'normal',
 humidity: 'normal',
 season: 'spring',
 careStyle: 'balanced',
 soilType: 'regular'
 };

 describe('baseline calculations', () => {
 it('returns no adjustments for baseline factors', () => {
  const result = calculateSmartWateringSchedule(7, baselineFactors);
  
  expect(result.recommendedDays).toBe(7);
  expect(result.baseDays).toBe(7);
  expect(result.totalAdjustment).toBe(0);
  expect(result.adjustmentReasons).toHaveLength(0);
  expect(result.confidence).toBe('high');
 });

 it('respects minimum boundary of 2 days', () => {
  const extremeFactors: WateringFactors = {
  plantSize: 'small',
  lightLevel: 'high',
  temperature: 'warm',
  humidity: 'dry',
  season: 'summer',
  careStyle: 'frequent',
  soilType: 'draining'
  };
  
  const result = calculateSmartWateringSchedule(1, extremeFactors);
  expect(result.recommendedDays).toBe(2);
 });

 it('respects maximum boundary of 45 days', () => {
  const conservativeFactors: WateringFactors = {
  plantSize: 'large',
  lightLevel: 'low',
  temperature: 'cool',
  humidity: 'humid',
  season: 'winter',
  careStyle: 'minimal',
  soilType: 'retaining'
  };
  
  const result = calculateSmartWateringSchedule(50, conservativeFactors);
  expect(result.recommendedDays).toBe(45);
 });
 });

 describe('plant size adjustments', () => {
 it('reduces watering interval for small plants', () => {
  const factors = { ...baselineFactors, plantSize: 'small' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('Small plants have less soil volume and dry out faster');
 });

 it('increases watering interval for large plants', () => {
  const factors = { ...baselineFactors, plantSize: 'large' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(9);
  expect(result.totalAdjustment).toBe(2);
  expect(result.adjustmentReasons).toContain('Large plants have more soil volume and retain moisture longer');
 });

 it('no adjustment for medium plants', () => {
  const factors = { ...baselineFactors, plantSize: 'medium' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.totalAdjustment).toBe(0);
 });
 });

 describe('light level adjustments', () => {
 it('increases watering interval for high light', () => {
  const factors = { ...baselineFactors, lightLevel: 'high' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(8);
  expect(result.totalAdjustment).toBe(1);
  expect(result.adjustmentReasons).toContain('High light increases photosynthesis and water evaporation');
 });

 it('decreases watering interval for low light', () => {
  const factors = { ...baselineFactors, lightLevel: 'low' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('Low light reduces plant metabolism and water consumption');
 });
 });

 describe('temperature adjustments', () => {
 it('increases watering interval for warm temperature', () => {
  const factors = { ...baselineFactors, temperature: 'warm' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(8);
  expect(result.totalAdjustment).toBe(1);
  expect(result.adjustmentReasons).toContain('Warm temperatures increase evaporation rate');
 });

 it('decreases watering interval for cool temperature', () => {
  const factors = { ...baselineFactors, temperature: 'cool' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('Cool temperatures slow down water evaporation');
 });
 });

 describe('humidity adjustments', () => {
 it('increases watering interval significantly for dry conditions', () => {
  const factors = { ...baselineFactors, humidity: 'dry' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(9);
  expect(result.totalAdjustment).toBe(2);
  expect(result.adjustmentReasons).toContain('Dry air increases water loss through transpiration');
 });

 it('decreases watering interval for humid conditions', () => {
  const factors = { ...baselineFactors, humidity: 'humid' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('High humidity reduces water loss');
 });
 });

 describe('seasonal adjustments', () => {
 it('increases watering interval significantly for winter', () => {
  const factors = { ...baselineFactors, season: 'winter' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(10);
  expect(result.totalAdjustment).toBe(3);
  expect(result.adjustmentReasons).toContain('Winter dormancy significantly reduces water needs');
 });

 it('decreases watering interval for summer', () => {
  const factors = { ...baselineFactors, season: 'summer' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('Summer growth phase increases water consumption');
 });

 it('increases watering interval for fall', () => {
  const factors = { ...baselineFactors, season: 'fall' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(8);
  expect(result.totalAdjustment).toBe(1);
  expect(result.adjustmentReasons).toContain('Fall season begins to slow plant metabolism');
 });

 it('no adjustment for spring', () => {
  const factors = { ...baselineFactors, season: 'spring' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.totalAdjustment).toBe(0);
 });
 });

 describe('care style adjustments', () => {
 it('decreases watering interval for frequent care style', () => {
  const factors = { ...baselineFactors, careStyle: 'frequent' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('Adjusted for hands-on care preference');
 });

 it('increases watering interval for minimal care style', () => {
  const factors = { ...baselineFactors, careStyle: 'minimal' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(8);
  expect(result.totalAdjustment).toBe(1);
  expect(result.adjustmentReasons).toContain('Adjusted for low-maintenance care style');
 });
 });

 describe('soil type adjustments', () => {
 it('decreases watering interval for draining soil', () => {
  const factors = { ...baselineFactors, soilType: 'draining' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(6);
  expect(result.totalAdjustment).toBe(-1);
  expect(result.adjustmentReasons).toContain('Well-draining soil dries out faster');
 });

 it('increases watering interval for retaining soil', () => {
  const factors = { ...baselineFactors, soilType: 'retaining' as const };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.recommendedDays).toBe(9);
  expect(result.totalAdjustment).toBe(2);
  expect(result.adjustmentReasons).toContain('Moisture-retaining soil stays wet longer');
 });
 });

 describe('confidence scoring', () => {
 it('returns high confidence for small adjustments (≤2)', () => {
  const factors = { ...baselineFactors, plantSize: 'small' as const }; // -1 adjustment
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.confidence).toBe('high');
  expect(Math.abs(result.totalAdjustment)).toBeLessThanOrEqual(2);
 });

 it('returns medium confidence for moderate adjustments (3-4)', () => {
  const factors = { 
  ...baselineFactors, 
  season: 'winter' as const, // +3 adjustment
  careStyle: 'minimal' as const // +1 adjustment
  };
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.confidence).toBe('medium');
  expect(Math.abs(result.totalAdjustment)).toBeGreaterThan(2);
  expect(Math.abs(result.totalAdjustment)).toBeLessThanOrEqual(4);
 });

 it('returns low confidence for large adjustments (>4)', () => {
  const factors = {
  plantSize: 'large', // +2
  lightLevel: 'high', // +1
  temperature: 'warm', // +1
  humidity: 'dry', // +2
  season: 'winter', // +3
  careStyle: 'minimal', // +1
  soilType: 'retaining' // +2
  // Total: +12, which is > 4
  } as const;
  const result = calculateSmartWateringSchedule(7, factors);
  
  expect(result.confidence).toBe('low');
  expect(Math.abs(result.totalAdjustment)).toBeGreaterThan(4);
 });
 });

 describe('complex combinations', () => {
 it('handles extreme dry conditions correctly', () => {
  const dryFactors: WateringFactors = {
  plantSize: 'small',
  lightLevel: 'high',
  temperature: 'warm',
  humidity: 'dry',
  season: 'summer',
  careStyle: 'frequent',
  soilType: 'draining'
  };
  
  const result = calculateSmartWateringSchedule(14, dryFactors);
  
  // Expected: -1 (small) + 1 (high light) + 1 (warm) + 2 (dry) - 1 (summer) - 1 (frequent) - 1 (draining) = 0
  expect(result.totalAdjustment).toBe(0);
  expect(result.recommendedDays).toBe(14);
  expect(result.adjustmentReasons.length).toBeGreaterThan(0);
 });

 it('handles winter dormancy conditions correctly', () => {
  const winterFactors: WateringFactors = {
  plantSize: 'large',
  lightLevel: 'low',
  temperature: 'cool',
  humidity: 'humid',
  season: 'winter',
  careStyle: 'minimal',
  soilType: 'retaining'
  };
  
  const result = calculateSmartWateringSchedule(7, winterFactors);
  
  // Expected: +2 (large) - 1 (low light) - 1 (cool) - 1 (humid) + 3 (winter) + 1 (minimal) + 2 (retaining) = +5
  expect(result.totalAdjustment).toBe(5);
  expect(result.recommendedDays).toBe(12);
  expect(result.confidence).toBe('low'); // >4 adjustment
 });
 });
});

describe('getCurrentSeason', () => {
 beforeEach(() => {
 vi.useFakeTimers();
 });

 afterEach(() => {
 vi.useRealTimers();
 });

 it('returns spring for March, April, May', () => {
 vi.setSystemTime(new Date('2024-03-15'));
 expect(getCurrentSeason()).toBe('spring');
 
 vi.setSystemTime(new Date('2024-04-15'));
 expect(getCurrentSeason()).toBe('spring');
 
 vi.setSystemTime(new Date('2024-05-15'));
 expect(getCurrentSeason()).toBe('spring');
 });

 it('returns summer for June, July, August', () => {
 vi.setSystemTime(new Date('2024-06-15'));
 expect(getCurrentSeason()).toBe('summer');
 
 vi.setSystemTime(new Date('2024-07-15'));
 expect(getCurrentSeason()).toBe('summer');
 
 vi.setSystemTime(new Date('2024-08-15'));
 expect(getCurrentSeason()).toBe('summer');
 });

 it('returns fall for September, October, November', () => {
 vi.setSystemTime(new Date('2024-09-15'));
 expect(getCurrentSeason()).toBe('fall');
 
 vi.setSystemTime(new Date('2024-10-15'));
 expect(getCurrentSeason()).toBe('fall');
 
 vi.setSystemTime(new Date('2024-11-15'));
 expect(getCurrentSeason()).toBe('fall');
 });

 it('returns winter for December, January, February', () => {
 vi.setSystemTime(new Date('2024-12-15'));
 expect(getCurrentSeason()).toBe('winter');
 
 vi.setSystemTime(new Date('2024-01-15'));
 expect(getCurrentSeason()).toBe('winter');
 
 vi.setSystemTime(new Date('2024-02-15'));
 expect(getCurrentSeason()).toBe('winter');
 });
});

describe('getFactorLabels', () => {
 it('returns complete factor labels object', () => {
 const labels = getFactorLabels();
 
 expect(labels).toHaveProperty('plantSize');
 expect(labels).toHaveProperty('lightLevel');
 expect(labels).toHaveProperty('temperature');
 expect(labels).toHaveProperty('humidity');
 expect(labels).toHaveProperty('season');
 expect(labels).toHaveProperty('careStyle');
 expect(labels).toHaveProperty('soilType');
 });

 it('returns correct plant size labels', () => {
 const labels = getFactorLabels();
 
 expect(labels.plantSize.small).toBe('Small (up to 6")');
 expect(labels.plantSize.medium).toBe('Medium (6" to 2 feet)');
 expect(labels.plantSize.large).toBe('Large (2+ feet)');
 });

 it('returns correct light level labels', () => {
 const labels = getFactorLabels();
 
 expect(labels.lightLevel.low).toContain('Low Light');
 expect(labels.lightLevel.medium).toContain('Medium Light');
 expect(labels.lightLevel.high).toContain('High Light');
 });

 it('returns correct temperature labels with ranges', () => {
 const labels = getFactorLabels();
 
 expect(labels.temperature.cool).toContain('60-70°F');
 expect(labels.temperature.normal).toContain('70-75°F');
 expect(labels.temperature.warm).toContain('75°F+');
 });

 it('returns correct humidity labels with percentages', () => {
 const labels = getFactorLabels();
 
 expect(labels.humidity.dry).toContain('< 40%');
 expect(labels.humidity.normal).toContain('40-60%');
 expect(labels.humidity.humid).toContain('60%+');
 });
});
