import { describe, test, expect, beforeEach, vi } from 'vitest';
import { WateringPatternAnalyzer } from '../watering-pattern-analyzer';
import type {
  WateringPatternData,
  WateringRecordForAnalysis,
  PatternAnalysisOptions,
} from '../../types/wateringPatternTypes';

// Test helper functions
const createMockRecord = (daysAgo: number, notes?: string): WateringRecordForAnalysis => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `record-${daysAgo}`,
    watered_at: date.toISOString(),
    notes: notes || null,
  };
};

const createWateringHistory = (intervals: number[], suggestedDays = 7): WateringRecordForAnalysis[] => {
  let totalDays = 0;
  return intervals.map((interval, index) => {
    totalDays += interval;
    return createMockRecord(totalDays, index === 0 ? undefined : `Regular watering #${index + 1}`);
  }).reverse(); // Most recent first
};

const createTestPlantData = (
  records: WateringRecordForAnalysis[],
  suggestedDays = 7,
  plantId = 'test-plant-1'
): WateringPatternData => ({
  plantId,
  records,
  suggestedDays,
  analysisDate: new Date(),
});

describe('WateringPatternAnalyzer', () => {
  let analyzer: WateringPatternAnalyzer;

  beforeEach(() => {
    analyzer = new WateringPatternAnalyzer();
    vi.useRealTimers();
  });

  describe('Pattern Detection', () => {
    describe('Early Watering Pattern', () => {
      test('should detect early watering pattern with consistent 2-day early watering', () => {
        // Water every 5 days instead of 7 (2 days early each time)
        const records = createWateringHistory([5, 5, 5, 5], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('early');
        expect(result.confidence).toBe('high');
        expect(result.actualAverageInterval).toBe(5);
        expect(result.suggestedAdjustment).toBe(5);
        expect(result.reasoning.some(r => r.includes('You tend to water 2.0 days earlier than your 7-day schedule'))).toBe(true);
      });

      test('should detect early watering with moderate confidence', () => {
        // Mostly early with one on-time watering
        const records = createWateringHistory([5, 5, 7, 5], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('early');
        expect(result.confidence).toBe('medium');
        expect(result.actualAverageInterval).toBeCloseTo(5.7, 1); // Average of [5, 7, 5] = 5.67
      });

      test('should suggest schedule adjustment for early waterers', () => {
        const records = createWateringHistory([5, 5, 5, 5, 5], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.suggestedAdjustment).toBe(5);
        expect(result.reasoning.some(r => r.includes('This could indicate the plant needs water sooner than expected'))).toBe(true);
      });
    });

    describe('Late Watering Pattern', () => {
      test('should detect late watering pattern with consistent 2-day late watering', () => {
        // Water every 9 days instead of 7 (2 days late each time)
        const records = createWateringHistory([9, 9, 9, 9], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('late');
        expect(result.confidence).toBe('high');
        expect(result.actualAverageInterval).toBe(9);
        expect(result.suggestedAdjustment).toBe(9);
        expect(result.reasoning.some(r => r.includes('You tend to water 2.0 days later than your 7-day schedule'))).toBe(true);
      });

      test('should detect late watering with varying delays', () => {
        // Water 2-3 days late consistently
        const records = createWateringHistory([9, 10, 9, 10], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('late');
        expect(result.confidence).toBe('medium');
        expect(result.actualAverageInterval).toBeCloseTo(9.7, 1);
      });

      test('should suggest schedule extension for late waterers', () => {
        const records = createWateringHistory([10, 10, 10, 10], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.suggestedAdjustment).toBe(10);
        expect(result.reasoning.some(r => r.includes('Consider if the current schedule fits your routine'))).toBe(true);
      });
    });

    describe('Consistent Watering Pattern', () => {
      test('should detect consistent watering pattern', () => {
        // Water exactly on schedule with minor variations
        const records = createWateringHistory([7, 7, 8, 6, 7], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('consistent');
        expect(result.confidence).toBe('high');
        expect(result.actualAverageInterval).toBe(7);
        expect(result.suggestedAdjustment).toBeUndefined();
        expect(result.reasoning.some(r => r.includes('This aligns well with your 7-day schedule'))).toBe(true);
      });

      test('should not suggest adjustments for consistent waterers', () => {
        const records = createWateringHistory([7, 6, 8, 7, 7], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('consistent');
        expect(result.suggestedAdjustment).toBeUndefined();
        expect(result.reasoning.some(r => r.includes('Your watering routine is very consistent'))).toBe(true);
      });
    });

    describe('Irregular Watering Pattern', () => {
      test('should detect irregular watering pattern', () => {
        // Highly variable intervals
        const records = createWateringHistory([3, 12, 5, 15, 2], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('irregular');
        expect(result.confidence).toBe('low');
        expect(result.suggestedAdjustment).toBeUndefined();
        expect(result.reasoning.some(r => r.includes('Your watering pattern varies significantly'))).toBe(true);
      });

      test('should suggest consistency improvement for irregular patterns', () => {
        const records = createWateringHistory([4, 11, 6, 14], 7);
        const data = createTestPlantData(records, 7);

        const result = analyzer.analyzePattern(data);

        expect(result.pattern).toBe('irregular');
        expect(result.reasoning.some(r => r.includes('Consider setting reminders for more consistent watering'))).toBe(true);
      });
    });
  });

  describe('Confidence Calculation', () => {
    test('should assign high confidence for consistent patterns with sufficient data', () => {
      const records = createWateringHistory([5, 5, 5, 5, 5, 5, 5, 5], 7); // 8 records
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.confidence).toBe('high');
      expect(result.pattern).toBe('early');
    });

    test('should assign medium confidence for moderate patterns', () => {
      const records = createWateringHistory([5, 6, 5, 6, 5], 7); // Some variation
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.confidence).toBe('medium');
    });

    test('should assign low confidence for insufficient or inconsistent data', () => {
      const records = createWateringHistory([3, 15, 4], 7); // High variation
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.confidence).toBe('low');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle insufficient data gracefully', () => {
      const records = createWateringHistory([7, 8], 7); // Only 2 records
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('irregular');
      expect(result.confidence).toBe('low');
      expect(result.reasoning.some(r => r.includes('Need at least 3 watering records'))).toBe(true);
      expect(result.suggestedAdjustment).toBeUndefined();
    });

    test('should filter out postponement records', () => {
      const records = [
        createMockRecord(7),
        createMockRecord(14, 'POSTPONEMENT: Plant didn\'t need water'),
        createMockRecord(21),
        createMockRecord(28),
      ];
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      // Should ignore the postponement record and analyze the others
      expect(result.actualAverageInterval).toBe(10.5); // Records at days 7, 21, 28 = intervals [14, 7] = avg 10.5
    });

    test('should handle malformed dates gracefully', () => {
      const records = [
        { id: '1', watered_at: 'invalid-date', notes: null },
        createMockRecord(7),
        createMockRecord(14),
      ];
      const data = createTestPlantData(records, 7);

      expect(() => analyzer.analyzePattern(data)).not.toThrow();
    });

    test('should handle empty records array', () => {
      const data = createTestPlantData([], 7);

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('irregular');
      expect(result.confidence).toBe('low');
      expect(result.reasoning.some(r => r.includes('Need at least 3 watering records'))).toBe(true);
    });

    test('should handle extreme intervals gracefully', () => {
      const records = createWateringHistory([1, 45, 1, 45], 7); // Very extreme
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('irregular');
      expect(result.confidence).toBe('low');
    });

    test('should respect analysis window limits', () => {
      const analyzer = new WateringPatternAnalyzer({ analysisWindowDays: 30 });
      
      // Create records spanning 45 days (should only analyze last 30)
      const records = [
        createMockRecord(5),
        createMockRecord(12),
        createMockRecord(19),
        createMockRecord(26),
        createMockRecord(33), // Should be excluded (beyond 30 days)
        createMockRecord(40), // Should be excluded
      ];
      const data = createTestPlantData(records, 7);

      const stats = analyzer.getAnalysisStats(records, new Date());

      expect(stats.recordsUsed).toBeLessThan(records.length);
    });
  });

  describe('Schedule Suggestions', () => {
    test('should not suggest minor adjustments (within 1.5 days)', () => {
      const records = createWateringHistory([6, 6, 6, 6], 7); // 1 day early, not significant
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.suggestedAdjustment).toBeUndefined(); // No suggestion for minor deviation
    });

    test('should suggest adjustments for significant deviations', () => {
      const records = createWateringHistory([5, 5, 5, 5], 7); // 2 days early, significant
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.suggestedAdjustment).toBe(5);
    });

    test('should bound suggestions within reasonable limits', () => {
      const records = createWateringHistory([1, 1, 1, 1], 7); // Extreme early watering
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.suggestedAdjustment).toBeGreaterThanOrEqual(2); // Minimum 2 days
      expect(result.suggestedAdjustment).toBeLessThanOrEqual(30); // Maximum 30 days
    });

    test('should not suggest adjustments for irregular patterns', () => {
      const records = createWateringHistory([3, 15, 4, 12], 7);
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('irregular');
      expect(result.suggestedAdjustment).toBeUndefined();
    });
  });

  describe('Insights Generation', () => {
    test('should generate schedule adjustment insight for early waterer', () => {
      const analysis = {
        plantId: 'test-plant',
        currentSchedule: 7,
        actualAverageInterval: 5,
        pattern: 'early' as const,
        confidence: 'high' as const,
        suggestedAdjustment: 5,
        reasoning: ['Test reasoning'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('schedule_adjustment');
      expect(insights[0].title).toContain('Shortening');
      expect(insights[0].actionable).toBe(true);
      expect(insights[0].suggestion?.suggestedSchedule).toBe(5);
    });

    test('should generate overwatering risk insight for very early pattern', () => {
      const analysis = {
        plantId: 'test-plant',
        currentSchedule: 7,
        actualAverageInterval: 3,
        pattern: 'early' as const,
        confidence: 'high' as const,
        suggestedAdjustment: 3,
        reasoning: ['Test reasoning'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights.some(insight => insight.type === 'overwatering_risk')).toBe(true);
      const overWaterInsight = insights.find(insight => insight.type === 'overwatering_risk');
      expect(overWaterInsight?.severity).toBe('high');
    });

    test('should generate consistency improvement insight for irregular pattern', () => {
      const analysis = {
        plantId: 'test-plant',
        currentSchedule: 7,
        actualAverageInterval: 8,
        pattern: 'irregular' as const,
        confidence: 'high' as const,
        reasoning: ['Test reasoning'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights.some(insight => insight.type === 'consistency_improvement')).toBe(true);
    });

    test('should not generate insights for consistent pattern', () => {
      const analysis = {
        plantId: 'test-plant',
        currentSchedule: 7,
        actualAverageInterval: 7,
        pattern: 'consistent' as const,
        confidence: 'high' as const,
        reasoning: ['Test reasoning'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights).toHaveLength(0);
    });
  });

  describe('Analysis Statistics', () => {
    test('should calculate detailed statistics', () => {
      const records = createWateringHistory([6, 7, 8, 6, 7], 7);
      const stats = analyzer.getAnalysisStats(records, new Date());

      expect(stats.totalRecords).toBe(5);
      expect(stats.recordsUsed).toBe(5);
      expect(stats.averageInterval).toBeCloseTo(7.0, 1);
      expect(stats.standardDeviation).toBeGreaterThan(0);
      expect(stats.minInterval).toBe(6);
      expect(stats.maxInterval).toBe(8);
      expect(stats.dataQuality).toBe('good');
    });

    test('should assess data quality correctly', () => {
      // Excellent data: 10+ records with high consistency
      const excellentRecords = createWateringHistory(Array(10).fill(7), 7);
      const excellentStats = analyzer.getAnalysisStats(excellentRecords, new Date());
      expect(excellentStats.dataQuality).toBe('excellent');

      // Good data: 6+ records with moderate consistency
      const goodRecords = createWateringHistory([6, 7, 8, 6, 7, 8], 7);
      const goodStats = analyzer.getAnalysisStats(goodRecords, new Date());
      expect(goodStats.dataQuality).toBe('good');

      // Limited data: few records
      const limitedRecords = createWateringHistory([7, 8, 6], 7);
      const limitedStats = analyzer.getAnalysisStats(limitedRecords, new Date());
      expect(limitedStats.dataQuality).toBe('limited');

      // Insufficient data: too few records
      const insufficientRecords = createWateringHistory([7], 7);
      const insufficientStats = analyzer.getAnalysisStats(insufficientRecords, new Date());
      expect(insufficientStats.dataQuality).toBe('insufficient');
    });
  });

  describe('Custom Options', () => {
    test('should respect custom minimum records option', () => {
      const analyzer = new WateringPatternAnalyzer({ minRecords: 5 });
      const records = createWateringHistory([7, 7, 7], 7); // Only 3 records
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.reasoning.some(r => r.includes('Need at least 5 watering records'))).toBe(true);
    });

    test('should respect custom consistency threshold', () => {
      const analyzer = new WateringPatternAnalyzer({ consistencyThreshold: 0.9 });
      const records = createWateringHistory([6, 7, 8, 6], 7); // Moderate variation
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      // With high threshold, should be classified as irregular
      expect(result.pattern).toBe('irregular');
    });

    test('should respect custom early/late threshold', () => {
      const analyzer = new WateringPatternAnalyzer({ earlyLateThresholdDays: 3 });
      const records = createWateringHistory([5, 5, 5, 5], 7); // 2 days early
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      // With 3-day threshold, 2 days early should be consistent
      expect(result.pattern).toBe('consistent');
    });
  });

  describe('Reasoning Generation', () => {
    test('should provide context-specific reasoning for early waterers', () => {
      const records = createWateringHistory([5, 5, 5, 5], 7);
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.reasoning.some(r => r.includes('You tend to water 2.0 days earlier'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('This could indicate the plant needs water sooner'))).toBe(true);
    });

    test('should provide context-specific reasoning for late waterers', () => {
      const records = createWateringHistory([10, 10, 10, 10], 7);
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.reasoning.some(r => r.includes('You tend to water 3.0 days later'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('Consider if the current schedule fits your routine'))).toBe(true);
    });

    test('should acknowledge consistency for regular waterers', () => {
      const records = createWateringHistory([7, 7, 7, 7, 7, 7], 7);
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.reasoning.some(r => r.includes('You water consistently'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('Your watering routine is very consistent'))).toBe(true);
    });

    test('should explain data quality in reasoning', () => {
      const records = createWateringHistory([7, 7, 7, 7, 7, 7, 7, 7], 7); // 8 records
      const data = createTestPlantData(records, 7);

      const result = analyzer.analyzePattern(data);

      expect(result.reasoning.some(r => r.includes('Analysis based on 8 watering records with high consistency'))).toBe(true);
    });
  });
});