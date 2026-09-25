import { describe, it, expect } from 'vitest';
import { computeCareStreak, type StreakRecord } from '@/utils/watering/careStreak';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-24T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();
const daysAhead = (n: number) => new Date(NOW + n * DAY).toISOString();

const weekly = { id: 'p1', suggested_watering_days: 7 };
const water = (n: number, plant_id = 'p1'): StreakRecord => ({ plant_id, watered_at: daysAgo(n), record_type: 'watering' });
const postpone = (iso: string, plant_id = 'p1'): StreakRecord => ({ plant_id, watered_at: iso, record_type: 'postponement' });

const streak = (records: StreakRecord[], plants = [weekly]) =>
  computeCareStreak(plants, records, NOW, NOW - 21 * DAY);

describe('computeCareStreak', () => {
  it('counts days when nothing is due toward the streak', () => {
    // Watered on time every 7 days; last watering 3 days ago, next not due for 4 more
    const result = streak([water(31), water(24), water(17), water(10), water(3)]);
    expect(result.streakDays).toBe(31);
    expect(result.onTimeRate).toBe(1);
  });

  it('restarts from the day a late watering finally happened', () => {
    // 7-day plant watered 12 days after the previous watering (5 days late), 2 days ago
    const result = streak([water(30), water(23), water(14), water(2)]);
    expect(result.streakDays).toBe(2);
  });

  it('forgives lateness inside the grace period', () => {
    // 8 days apart on a 7-day schedule is within 1 day of grace
    const result = streak([water(24), water(16), water(8), water(0)]);
    expect(result.streakDays).toBe(24);
    expect(result.onTimeRate).toBe(1);
  });

  it('treats a plant overdue past its grace as breaking the streak now', () => {
    const result = streak([water(30), water(23), water(9)]);
    expect(result.streakDays).toBe(0);
  });

  it('does not break the streak while a plant is 1 day overdue (within grace)', () => {
    const result = streak([water(22), water(15), water(8)]);
    expect(result.streakDays).toBe(22);
  });

  it('does not count a postponed watering as late', () => {
    // Due 7 days after day 24 (day 17); pushed to day 13, watered day 13 — 11 days later
    const result = streak([water(24), postpone(daysAgo(13)), water(13), water(6)]);
    expect(result.streakDays).toBe(24);
    expect(result.onTimeRate).toBe(1);
  });

  it('does not count a plant with an active postponement as overdue', () => {
    // Last watered 8 days ago (1 day late would be fine anyway); pushed 3 days out
    const result = streak([water(22), water(15), water(10), postpone(daysAhead(3))]);
    expect(result.streakDays).toBe(22);
  });

  it("does not let a later cycle's postponement excuse an earlier late watering", () => {
    // Watered 13 days after the previous one, then postponed the *next* watering
    const result = streak([water(20), water(7), postpone(daysAhead(1))]);
    expect(result.streakDays).toBe(7);
  });

  it('ignores plants with no watering history', () => {
    const result = streak(
      [water(14), water(7), water(0)],
      [weekly, { id: 'new', suggested_watering_days: 7 }]
    );
    expect(result.streakDays).toBe(14);
    expect(result.hasStreak).toBe(true);
  });

  it('reports no on-time rate without a full interval', () => {
    const result = streak([water(2)]);
    expect(result.onTimeRate).toBeNull();
    expect(result.streakDays).toBe(2);
  });
});
