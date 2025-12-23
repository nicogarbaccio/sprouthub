import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getDaysBetween,
  addDaysToDate,
  subtractDaysFromDate,
  isOverdue,
  isToday,
  toISOString,
  fromISOString,
  getStartOfDay,
  getEndOfDay,
  compareDates,
  DATE_FORMATS,
} from '../date-helpers';

describe('date-helpers', () => {
  const testDate = new Date('2025-01-15T14:30:00Z');
  const testDateString = '2025-01-15T14:30:00Z';

  describe('formatDate', () => {
    it('should format date with SHORT format', () => {
      const result = formatDate(testDate, 'SHORT');
      expect(result).toBe('Jan 15, 2025');
    });

    it('should format date with FULL format', () => {
      const result = formatDate(testDate, 'FULL');
      expect(result).toMatch(/Jan 15, 2025 at \d+:\d+ [AP]M/);
    });

    it('should format date with NUMERIC format', () => {
      const result = formatDate(testDate, 'NUMERIC');
      expect(result).toBe('01/15/2025');
    });

    it('should format date with ISO_DATE format', () => {
      const result = formatDate(testDate, 'ISO_DATE');
      expect(result).toBe('2025-01-15');
    });

    it('should format date with TIME format', () => {
      const result = formatDate(testDate, 'TIME');
      expect(result).toMatch(/\d+:\d+ [AP]M/);
    });

    it('should format date with relative format', () => {
      const result = formatDate(new Date(), 'relative');
      expect(result).toBe('less than a minute ago');
    });

    it('should accept ISO string as input', () => {
      const result = formatDate(testDateString, 'SHORT');
      expect(result).toBe('Jan 15, 2025');
    });

    it('should use custom format pattern', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd');
      expect(result).toBe('2025-01-15');
    });

    it('should default to SHORT format', () => {
      const result = formatDate(testDate);
      expect(result).toBe('Jan 15, 2025');
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const start = new Date('2025-01-01T12:00:00Z');
      const end = new Date('2025-01-10T12:00:00Z');
      expect(getDaysBetween(start, end)).toBe(9);
    });

    it('should return absolute value (order independent)', () => {
      const start = new Date('2025-01-10T12:00:00Z');
      const end = new Date('2025-01-01T12:00:00Z');
      expect(getDaysBetween(start, end)).toBe(9);
    });

    it('should accept ISO strings', () => {
      const result = getDaysBetween('2025-01-01T00:00:00Z', '2025-01-10T00:00:00Z');
      expect(result).toBe(9);
    });

    it('should default endDate to now', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = getDaysBetween(yesterday);
      expect(result).toBe(1);
    });

    it('should return 0 for same date', () => {
      const result = getDaysBetween(testDate, testDate);
      expect(result).toBe(0);
    });
  });

  describe('addDaysToDate', () => {
    it('should add days to a date', () => {
      const result = addDaysToDate(testDate, 5);
      expect(result.getUTCDate()).toBe(20);
      expect(result.getUTCMonth()).toBe(0); // January
    });

    it('should handle month rollover', () => {
      const result = addDaysToDate(new Date('2025-01-29T12:00:00Z'), 5);
      expect(result.getUTCDate()).toBe(3);
      expect(result.getUTCMonth()).toBe(1); // February
    });

    it('should accept ISO strings', () => {
      const result = addDaysToDate('2025-01-15T00:00:00Z', 5);
      expect(result.getUTCDate()).toBe(20);
    });
  });

  describe('subtractDaysFromDate', () => {
    it('should subtract days from a date', () => {
      const result = subtractDaysFromDate(testDate, 5);
      expect(result.getUTCDate()).toBe(10);
      expect(result.getUTCMonth()).toBe(0); // January
    });

    it('should handle month rollover', () => {
      const result = subtractDaysFromDate(new Date('2025-02-03T12:00:00Z'), 5);
      expect(result.getUTCDate()).toBe(29);
      expect(result.getUTCMonth()).toBe(0); // January
    });

    it('should accept ISO strings', () => {
      const result = subtractDaysFromDate('2025-01-15T00:00:00Z', 5);
      expect(result.getUTCDate()).toBe(10);
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates (not today)', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isOverdue(today)).toBe(false);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      expect(isOverdue(futureDate)).toBe(false);
    });

    it('should accept ISO strings', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      expect(isOverdue(yesterday.toISOString())).toBe(true);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });

    it('should accept ISO strings', () => {
      const today = new Date();
      expect(isToday(today.toISOString())).toBe(true);
    });

    it('should use calendar date comparison (ignore time)', () => {
      const earlyMorning = new Date();
      earlyMorning.setHours(0, 0, 0, 0);
      const lateNight = new Date();
      lateNight.setHours(23, 59, 59, 999);
      expect(isToday(earlyMorning)).toBe(true);
      expect(isToday(lateNight)).toBe(true);
    });
  });

  describe('toISOString', () => {
    it('should convert Date to ISO string', () => {
      const result = toISOString(testDate);
      expect(result).toBe('2025-01-15T14:30:00.000Z');
    });

    it('should maintain timezone info', () => {
      const result = toISOString(new Date('2025-01-15T00:00:00Z'));
      expect(result).toContain('Z');
    });
  });

  describe('fromISOString', () => {
    it('should parse ISO string to Date', () => {
      const result = fromISOString('2025-01-15T14:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(testDate.getTime());
    });

    it('should handle partial ISO strings', () => {
      const result = fromISOString('2025-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(0);
      expect(result.getUTCDate()).toBe(15);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day', () => {
      const result = getStartOfDay(testDate);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should accept ISO strings', () => {
      const result = getStartOfDay(testDateString);
      expect(result.getHours()).toBe(0);
    });

    it('should default to now', () => {
      const result = getStartOfDay();
      const today = new Date();
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getHours()).toBe(0);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day', () => {
      const result = getEndOfDay(testDate);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should accept ISO strings', () => {
      const result = getEndOfDay(testDateString);
      expect(result.getHours()).toBe(23);
    });

    it('should default to now', () => {
      const result = getEndOfDay();
      const today = new Date();
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getHours()).toBe(23);
    });
  });

  describe('compareDates', () => {
    it('should return 1 when first date is after second', () => {
      const result = compareDates(new Date('2025-01-15'), new Date('2025-01-10'));
      expect(result).toBe(1);
    });

    it('should return -1 when first date is before second', () => {
      const result = compareDates(new Date('2025-01-10'), new Date('2025-01-15'));
      expect(result).toBe(-1);
    });

    it('should return 0 when dates are equal', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = compareDates(date, date);
      expect(result).toBe(0);
    });

    it('should accept ISO strings', () => {
      const result = compareDates('2025-01-15T00:00:00Z', '2025-01-10T00:00:00Z');
      expect(result).toBe(1);
    });

    it('should handle mixed Date and string inputs', () => {
      const result = compareDates(new Date('2025-01-15'), '2025-01-10T00:00:00Z');
      expect(result).toBe(1);
    });
  });

  describe('DATE_FORMATS', () => {
    it('should have all required format constants', () => {
      expect(DATE_FORMATS.FULL).toBeDefined();
      expect(DATE_FORMATS.SHORT).toBeDefined();
      expect(DATE_FORMATS.NUMERIC).toBeDefined();
      expect(DATE_FORMATS.ISO_DATE).toBeDefined();
      expect(DATE_FORMATS.TIME).toBeDefined();
      expect(DATE_FORMATS.RELATIVE).toBeDefined();
    });

    it('should have correct format strings', () => {
      expect(DATE_FORMATS.FULL).toBe("MMM d, yyyy 'at' h:mm a");
      expect(DATE_FORMATS.SHORT).toBe('MMM d, yyyy');
      expect(DATE_FORMATS.NUMERIC).toBe('MM/dd/yyyy');
      expect(DATE_FORMATS.ISO_DATE).toBe('yyyy-MM-dd');
      expect(DATE_FORMATS.TIME).toBe('h:mm a');
      expect(DATE_FORMATS.RELATIVE).toBe('relative');
    });
  });
});
