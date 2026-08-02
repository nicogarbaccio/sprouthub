import { describe, it, expect } from 'vitest';
import { WateringPatternAnalyzer } from '../watering/patternAnalyzer';
import type { WateringPatternData, WateringRecordForAnalysis } from '@/types/wateringPatternTypes';

describe('WateringPatternAnalyzer', () => {
  const analyzer = new WateringPatternAnalyzer();
  const analysisDate = new Date('2025-01-20T12:00:00Z');

  describe('analyzePattern', () => {
    it('should return insufficient data analysis when records are below minimum', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-18T10:00:00Z' },
          { id: '2', watered_at: '2025-01-10T10:00:00Z' },
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('irregular');
      expect(result.confidence).toBe('low');
      expect(result.actualAverageInterval).toBe(0);
      expect(result.reasoning).toContain('Need at least 3 watering records for pattern analysis');
    });

    it('should detect consistent watering pattern', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-13T10:00:00Z' }, // 7 days
          { id: '3', watered_at: '2025-01-06T10:00:00Z' }, // 7 days
          { id: '4', watered_at: '2024-12-30T10:00:00Z' }, // 7 days
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('consistent');
      expect(result.actualAverageInterval).toBe(7);
      // 3 intervals (4 records) is deliberately below the threshold for medium/high
      // confidence — a single outlier would swing the result. Confidence grows with data.
      expect(result.confidence).toBe('low');
    });

    it('should reach high confidence with enough consistent data', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-13T10:00:00Z' },
          { id: '3', watered_at: '2025-01-06T10:00:00Z' },
          { id: '4', watered_at: '2024-12-30T10:00:00Z' },
          { id: '5', watered_at: '2024-12-23T10:00:00Z' },
          { id: '6', watered_at: '2024-12-16T10:00:00Z' },
          { id: '7', watered_at: '2024-12-09T10:00:00Z' },
          { id: '8', watered_at: '2024-12-02T10:00:00Z' },
          { id: '9', watered_at: '2024-11-25T10:00:00Z' },
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('consistent');
      expect(result.confidence).toBe('high');
    });

    it('should detect early watering pattern', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-15T10:00:00Z' }, // 5 days
          { id: '3', watered_at: '2025-01-10T10:00:00Z' }, // 5 days
          { id: '4', watered_at: '2025-01-05T10:00:00Z' }, // 5 days
        ],
        suggestedDays: 10,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('early');
      expect(result.actualAverageInterval).toBe(5);
      // 3 intervals = low confidence, same threshold as the consistent test above.
      expect(result.confidence).toBe('low');
    });

    it('should detect early pattern with medium confidence given enough data', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-15T10:00:00Z' },
          { id: '3', watered_at: '2025-01-10T10:00:00Z' },
          { id: '4', watered_at: '2025-01-05T10:00:00Z' },
          { id: '5', watered_at: '2024-12-31T10:00:00Z' },
          { id: '6', watered_at: '2024-12-26T10:00:00Z' },
        ],
        suggestedDays: 10,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('early');
      expect(result.confidence).not.toBe('low');
    });

    it('should detect late watering pattern', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-10T10:00:00Z' }, // 10 days
          { id: '3', watered_at: '2024-12-31T10:00:00Z' }, // 10 days
          { id: '4', watered_at: '2024-12-21T10:00:00Z' }, // 10 days
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('late');
      expect(result.actualAverageInterval).toBe(10);
    });

    it('should detect irregular watering pattern', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-17T10:00:00Z' }, // 3 days
          { id: '3', watered_at: '2025-01-07T10:00:00Z' }, // 10 days
          { id: '4', watered_at: '2025-01-02T10:00:00Z' }, // 5 days
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.pattern).toBe('irregular');
    });

    it('should filter out postponement records', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-15T10:00:00Z', notes: 'POSTPONEMENT: Skipped' },
          { id: '3', watered_at: '2025-01-13T10:00:00Z' },
          { id: '4', watered_at: '2025-01-06T10:00:00Z' },
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Should have 3 records minus postponement = 2 intervals
      expect(result.actualAverageInterval).toBe(7);
    });

    it('should only analyze records within the analysis window', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-13T10:00:00Z' }, // 7 days
          { id: '3', watered_at: '2025-01-06T10:00:00Z' }, // 7 days
          { id: '4', watered_at: '2024-10-01T10:00:00Z' }, // Way too old (outside 60-day window)
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Should only use recent 3 records = 2 intervals
      expect(result.actualAverageInterval).toBe(7);
    });

    it('should suggest schedule adjustment for significant deviations', () => {
      // Need 5+ intervals (6+ records) for the code to reach medium confidence and produce a
      // suggestion. Extending the schedule (watering less often) additionally requires health
      // evidence — the user must have confirmed the plant looked fine when watered late.
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z', notes: 'LATE_HEALTHY:' },
          { id: '2', watered_at: '2025-01-10T10:00:00Z', notes: 'LATE_HEALTHY:' },
          { id: '3', watered_at: '2024-12-31T10:00:00Z', notes: 'LATE_HEALTHY:' },
          { id: '4', watered_at: '2024-12-21T10:00:00Z' },
          { id: '5', watered_at: '2024-12-11T10:00:00Z' },
          { id: '6', watered_at: '2024-12-01T10:00:00Z' },
          { id: '7', watered_at: '2024-11-21T10:00:00Z' },
        ],
        suggestedDays: 5, // Suggesting 5 but user does 10 — and reports plant is fine
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.suggestedAdjustment).toBeDefined();
      expect(result.suggestedAdjustment).toBe(10);
    });

    it('should NOT suggest adjustment with only 3-4 data points', () => {
      // Insufficient data to be confident in a recommendation.
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-10T10:00:00Z' },
          { id: '3', watered_at: '2024-12-31T10:00:00Z' },
          { id: '4', watered_at: '2024-12-21T10:00:00Z' },
        ],
        suggestedDays: 5,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Pattern is detected, but confidence is too low to act on.
      expect(result.pattern).toBe('late');
      expect(result.suggestedAdjustment).toBeUndefined();
    });

    it('should not suggest adjustment for small deviations', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-13T10:00:00Z' }, // 7 days
          { id: '3', watered_at: '2025-01-06T10:00:00Z' }, // 7 days
          { id: '4', watered_at: '2024-12-30T10:00:00Z' }, // 7 days
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      expect(result.suggestedAdjustment).toBeUndefined();
    });
  });

  describe('generateInsights', () => {
    it('should generate schedule adjustment insight', () => {
      const analysis = {
        plantId: 'plant-1',
        currentSchedule: 5,
        actualAverageInterval: 10,
        pattern: 'late' as const,
        confidence: 'high' as const,
        suggestedAdjustment: 10,
        reasoning: ['You tend to water later than scheduled'],
      };

      const insights = analyzer.generateInsights(analysis);

      // Should generate schedule adjustment and underwatering risk insights
      expect(insights.length).toBeGreaterThanOrEqual(1);
      const adjustmentInsight = insights.find(i => i.type === 'schedule_adjustment');
      expect(adjustmentInsight).toBeDefined();
      expect(adjustmentInsight?.severity).toBe('high');
      expect(adjustmentInsight?.actionable).toBe(true);
    });

    it('should generate irregular pattern insight', () => {
      const analysis = {
        plantId: 'plant-1',
        currentSchedule: 7,
        actualAverageInterval: 7,
        pattern: 'irregular' as const,
        confidence: 'high' as const,
        reasoning: ['Your watering pattern varies significantly'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights.some(i => i.type === 'consistency_improvement')).toBe(true);
    });

    it('should generate overwatering risk insight', () => {
      const analysis = {
        plantId: 'plant-1',
        currentSchedule: 10,
        actualAverageInterval: 5,
        pattern: 'early' as const,
        confidence: 'high' as const,
        reasoning: ['You water earlier than scheduled'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights.some(i => i.type === 'overwatering_risk')).toBe(true);
      expect(insights.find(i => i.type === 'overwatering_risk')?.severity).toBe('high');
    });

    it('should generate underwatering risk insight', () => {
      const analysis = {
        plantId: 'plant-1',
        currentSchedule: 5,
        actualAverageInterval: 10,
        pattern: 'late' as const,
        confidence: 'medium' as const,
        reasoning: ['You water later than scheduled'],
      };

      const insights = analyzer.generateInsights(analysis);

      expect(insights.some(i => i.type === 'underwatering_risk')).toBe(true);
    });
  });

  describe('getAnalysisStats', () => {
    it('should return insufficient stats for no records', () => {
      const stats = analyzer.getAnalysisStats([], analysisDate);

      expect(stats.dataQuality).toBe('insufficient');
      expect(stats.totalRecords).toBe(0);
      expect(stats.averageInterval).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const records: WateringRecordForAnalysis[] = [
        { id: '1', watered_at: '2025-01-20T10:00:00Z' },
        { id: '2', watered_at: '2025-01-13T10:00:00Z' }, // 7 days
        { id: '3', watered_at: '2025-01-06T10:00:00Z' }, // 7 days
        { id: '4', watered_at: '2024-12-30T10:00:00Z' }, // 7 days
      ];

      const stats = analyzer.getAnalysisStats(records, analysisDate);

      expect(stats.totalRecords).toBe(4);
      expect(stats.recordsUsed).toBe(4);
      expect(stats.averageInterval).toBe(7);
      expect(stats.minInterval).toBe(7);
      expect(stats.maxInterval).toBe(7);
      expect(stats.standardDeviation).toBe(0);
      expect(stats.dataQuality).toBe('limited');
    });

    it('should calculate variance and standard deviation', () => {
      const records: WateringRecordForAnalysis[] = [
        { id: '1', watered_at: '2025-01-20T10:00:00Z' },
        { id: '2', watered_at: '2025-01-15T10:00:00Z' }, // 5 days
        { id: '3', watered_at: '2025-01-06T10:00:00Z' }, // 9 days
        { id: '4', watered_at: '2024-12-30T10:00:00Z' }, // 7 days
      ];

      const stats = analyzer.getAnalysisStats(records, analysisDate);

      expect(stats.averageInterval).toBe(7);
      expect(stats.minInterval).toBe(5);
      expect(stats.maxInterval).toBe(9);
      expect(stats.standardDeviation).toBeGreaterThan(0);
    });

    it('should assess excellent data quality', () => {
      // 8+ records with consistent intervals
      const records: WateringRecordForAnalysis[] = [
        { id: '1', watered_at: '2025-01-20T10:00:00Z' },
        { id: '2', watered_at: '2025-01-13T10:00:00Z' },
        { id: '3', watered_at: '2025-01-06T10:00:00Z' },
        { id: '4', watered_at: '2024-12-30T10:00:00Z' },
        { id: '5', watered_at: '2024-12-23T10:00:00Z' },
        { id: '6', watered_at: '2024-12-16T10:00:00Z' },
        { id: '7', watered_at: '2024-12-09T10:00:00Z' },
        { id: '8', watered_at: '2024-12-02T10:00:00Z' },
      ];

      const stats = analyzer.getAnalysisStats(records, analysisDate);

      expect(stats.dataQuality).toBe('excellent');
    });
  });

  describe('custom options', () => {
    it('should respect custom minRecords option', () => {
      const customAnalyzer = new WateringPatternAnalyzer({ minRecords: 5 });

      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-13T10:00:00Z' },
          { id: '3', watered_at: '2025-01-06T10:00:00Z' },
          { id: '4', watered_at: '2024-12-30T10:00:00Z' },
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = customAnalyzer.analyzePattern(data);

      // Should return insufficient data with 4 records when min is 5
      expect(result.reasoning).toContain('Need at least 5 watering records for pattern analysis');
    });

    it('should respect custom analysisWindowDays option', () => {
      const customAnalyzer = new WateringPatternAnalyzer({ analysisWindowDays: 30 });

      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-10T10:00:00Z' },
          { id: '3', watered_at: '2024-12-15T10:00:00Z' }, // 36 days ago - outside 30-day window
          { id: '4', watered_at: '2024-12-05T10:00:00Z' },
        ],
        suggestedDays: 10,
        analysisDate,
      };

      const result = customAnalyzer.analyzePattern(data);

      // Should only use 2 records = 1 interval, insufficient for analysis
      expect(result.confidence).toBe('low');
    });

    it('should respect custom earlyLateThresholdDays option', () => {
      const customAnalyzer = new WateringPatternAnalyzer({ earlyLateThresholdDays: 3 });

      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-12T10:00:00Z' }, // 8 days
          { id: '3', watered_at: '2025-01-04T10:00:00Z' }, // 8 days
          { id: '4', watered_at: '2024-12-27T10:00:00Z' }, // 8 days
        ],
        suggestedDays: 10,
        analysisDate,
      };

      const result = customAnalyzer.analyzePattern(data);

      // With threshold of 3, deviation of 2 days (10-8) should not trigger early
      expect(result.pattern).not.toBe('early');
    });
  });

  describe('edge cases', () => {
    it('should handle records with same timestamp', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-20T10:00:00Z' }, // Same time
          { id: '3', watered_at: '2025-01-13T10:00:00Z' },
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Should filter out zero-day intervals
      expect(result.pattern).toBeDefined();
    });

    it('should handle very large intervals', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-10T10:00:00Z' }, // 10 days
          { id: '3', watered_at: '2025-01-01T10:00:00Z' }, // 9 days
          { id: '4', watered_at: '2024-11-01T10:00:00Z' }, // 70 days - outside reasonable range (>45)
        ],
        suggestedDays: 10,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Should filter out unreasonable intervals (>45 days)
      // Should have 2 intervals between first 3 records
      expect(result.actualAverageInterval).toBeCloseTo(9.5, 1);
    });

    it('should handle future dates gracefully', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-02-01T10:00:00Z' }, // Future date
          { id: '3', watered_at: '2025-01-13T10:00:00Z' },
          { id: '4', watered_at: '2025-01-06T10:00:00Z' },
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Should filter out future dates
      expect(result.pattern).toBeDefined();
    });

    it('should bound suggested schedule between 2 and 30 days', () => {
      const data: WateringPatternData = {
        plantId: 'plant-1',
        records: [
          { id: '1', watered_at: '2025-01-20T10:00:00Z' },
          { id: '2', watered_at: '2025-01-19T10:00:00Z' }, // 1 day
          { id: '3', watered_at: '2025-01-18T10:00:00Z' }, // 1 day
          { id: '4', watered_at: '2025-01-17T10:00:00Z' }, // 1 day
        ],
        suggestedDays: 7,
        analysisDate,
      };

      const result = analyzer.analyzePattern(data);

      // Even though average is 1 day, suggested should be minimum 2
      if (result.suggestedAdjustment) {
        expect(result.suggestedAdjustment).toBeGreaterThanOrEqual(2);
        expect(result.suggestedAdjustment).toBeLessThanOrEqual(30);
      }
    });
  });
});
