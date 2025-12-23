import { describe, it, expect } from 'vitest';
import { computeOverwateringRisk, shouldShowOverwateringWarning, type WateringRecordLike } from '../overwatering';

describe('overwatering', () => {
  describe('computeOverwateringRisk', () => {
    const now = new Date('2025-01-15T12:00:00Z');

    it('should return none risk with no recent waterings', () => {
      const result = computeOverwateringRisk({
        records: [],
        suggestedDays: 7,
        now,
      });

      expect(result.level).toBe('none');
      expect(result.count).toBe(0);
      expect(result.avgIntervalDays).toBeUndefined();
    });

    it('should return none risk with single watering', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-14T10:00:00Z' },
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      expect(result.level).toBe('none');
      expect(result.count).toBe(1);
      expect(result.avgIntervalDays).toBeUndefined();
    });

    it('should calculate high risk when watering more than twice as frequently as suggested', () => {
      // Watering every 2 days when suggested is 7 days (2 < 7 * 0.5 = 3.5)
      // Window is 7 days, so only records from Jan 8 onward are counted
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-09T10:00:00Z' },
        { watered_at: '2025-01-11T10:00:00Z' }, // 2 days later
        { watered_at: '2025-01-13T10:00:00Z' }, // 2 days later
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      expect(result.level).toBe('high');
      expect(result.count).toBe(3);
      expect(result.avgIntervalDays).toBe(2);
    });

    it('should calculate low risk when watering somewhat too frequently', () => {
      // Watering every 6 days when suggested is 10 days (6 >= 10 * 0.5 = 5 but < 10 * 0.7 = 7)
      // Use longer suggested interval to make the test work with the window
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-05T10:00:00Z' }, // Older record to establish pattern
        { watered_at: '2025-01-09T10:00:00Z' }, // 4 days later (within 10-day window)
        { watered_at: '2025-01-15T10:00:00Z' }, // 6 days later (within 10-day window)
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 10,
        now,
      });

      expect(result.level).toBe('low');
      expect(result.count).toBe(2);
      expect(result.avgIntervalDays).toBe(6);
    });

    it('should return none risk when watering at appropriate intervals', () => {
      // Watering every 6 days when suggested is 7 days (6 >= 7 * 0.7 = 4.9)
      // Window is 7 days, so only last 2 records will be counted
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-09T10:00:00Z' },
        { watered_at: '2025-01-15T10:00:00Z' }, // 6 days later
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      expect(result.level).toBe('none');
      expect(result.count).toBe(2);
      expect(result.avgIntervalDays).toBe(6);
    });

    it('should filter out postponement records', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-10T10:00:00Z', notes: 'POSTPONEMENT: Skipped' },
        { watered_at: '2025-01-12T10:00:00Z' },
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      // Should only count non-postponement records (1 record within window)
      expect(result.count).toBe(1);
    });

    it('should only consider records within the window', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2024-12-01T10:00:00Z' }, // Too old, outside window
        { watered_at: '2025-01-14T10:00:00Z' }, // Within window
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      // Window is max(suggestedDays, 2) = 7 days, so only recent record counts
      expect(result.count).toBe(1);
    });

    it('should handle future dates by excluding them', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-14T10:00:00Z' },
        { watered_at: '2025-01-20T10:00:00Z' }, // Future date
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      expect(result.count).toBe(1); // Only the past record
    });

    it('should default to 7 days when suggestedDays is null', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-14T10:00:00Z' },
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: null,
        now,
      });

      expect(result.windowDays).toBe(7);
    });

    it('should enforce minimum window of 2 days', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-14T10:00:00Z' },
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 1,
        now,
      });

      expect(result.windowDays).toBe(2);
    });

    it('should enforce maximum window of 30 days', () => {
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-14T10:00:00Z' },
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 60,
        now,
      });

      expect(result.windowDays).toBe(30);
    });

    it('should use last 5 intervals for average calculation', () => {
      // 7 waterings = 6 intervals, should use last 5 for average
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-01T10:00:00Z' },
        { watered_at: '2025-01-03T10:00:00Z' }, // 2 days (not used in avg)
        { watered_at: '2025-01-06T10:00:00Z' }, // 3 days
        { watered_at: '2025-01-09T10:00:00Z' }, // 3 days
        { watered_at: '2025-01-11T10:00:00Z' }, // 2 days
        { watered_at: '2025-01-13T10:00:00Z' }, // 2 days
        { watered_at: '2025-01-15T10:00:00Z' }, // 2 days
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      // Last 5 intervals: 3, 3, 2, 2, 2 = avg 2.4 → rounds to 2
      expect(result.avgIntervalDays).toBe(2);
    });

    it('should return high risk for 4+ waterings without interval data', () => {
      // Edge case: if we somehow can't calculate intervals but have many waterings
      const records: WateringRecordLike[] = [
        { watered_at: '2025-01-14T10:00:00Z' },
        { watered_at: '2025-01-14T11:00:00Z' },
        { watered_at: '2025-01-14T12:00:00Z' },
        { watered_at: '2025-01-14T13:00:00Z' },
      ];

      const result = computeOverwateringRisk({
        records,
        suggestedDays: 7,
        now,
      });

      // 4 waterings on same day = 0 intervals, but count >= 4 triggers high risk
      expect(result.level).toBe('high');
      expect(result.count).toBe(4);
    });
  });

  describe('shouldShowOverwateringWarning', () => {
    it('should return false when lastWatered is null', () => {
      const result = shouldShowOverwateringWarning(null, 7);
      expect(result.showWarning).toBe(false);
      expect(result.daysSinceLastWatered).toBeUndefined();
    });

    it('should return false when lastWatered is undefined', () => {
      const result = shouldShowOverwateringWarning(undefined, 7);
      expect(result.showWarning).toBe(false);
      expect(result.daysSinceLastWatered).toBeUndefined();
    });

    it('should return false for future dates (postponed)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const result = shouldShowOverwateringWarning(futureDate.toISOString(), 7);
      expect(result.showWarning).toBe(false);
    });

    it('should show warning when watered today', () => {
      const today = new Date();
      const result = shouldShowOverwateringWarning(today.toISOString(), 7);

      expect(result.showWarning).toBe(true);
      expect(result.daysSinceLastWatered).toBe(0);
    });

    it('should show warning when watered 1 day ago', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = shouldShowOverwateringWarning(yesterday.toISOString(), 7);

      expect(result.showWarning).toBe(true);
      expect(result.daysSinceLastWatered).toBe(1);
    });

    it('should show warning when watered 2 days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const result = shouldShowOverwateringWarning(twoDaysAgo.toISOString(), 7);

      expect(result.showWarning).toBe(true);
      expect(result.daysSinceLastWatered).toBe(2);
    });

    it('should show warning when watered 3 days ago with 7-day schedule', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const result = shouldShowOverwateringWarning(threeDaysAgo.toISOString(), 7);

      // 3 < 7 * 0.5 = 3.5, so it shows warning for being too frequent
      expect(result.showWarning).toBe(true);
      expect(result.daysSinceLastWatered).toBe(3);
    });

    it('should show warning when watering too frequently (less than 50% of suggested)', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // With 10-day suggested schedule, watering after 2 days is too frequent (2 < 10 * 0.5 = 5)
      const result = shouldShowOverwateringWarning(twoDaysAgo.toISOString(), 10);

      expect(result.showWarning).toBe(true);
      expect(result.daysSinceLastWatered).toBe(2);
    });

    it('should not show warning when watering at appropriate frequency', () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      // With 10-day suggested schedule, watering after 6 days is fine (6 >= 10 * 0.5 = 5)
      const result = shouldShowOverwateringWarning(sixDaysAgo.toISOString(), 10);

      expect(result.showWarning).toBe(false);
      expect(result.daysSinceLastWatered).toBe(6);
    });

    it('should default to 7 days when suggestedWateringDays is not provided', () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = shouldShowOverwateringWarning(oneDayAgo.toISOString());

      // Should show warning because 1 day ago is within 2 days
      expect(result.showWarning).toBe(true);
    });
  });
});
