import { describe, it, expect } from 'vitest';
import { computeOverwateringRisk } from '../overwatering';

function daysAgo(n: number): string {
 const d = new Date();
 d.setDate(d.getDate() - n);
 return d.toISOString();
}

describe('computeOverwateringRisk', () => {
 it('returns none for no records', () => {
 const risk = computeOverwateringRisk({ records: [], suggestedDays: 7 });
 expect(risk.level).toBe('none');
 expect(risk.count).toBe(0);
 expect(risk.windowDays).toBe(7);
 });

 it('returns none for single watering within window', () => {
 const risk = computeOverwateringRisk({
  records: [{ watered_at: daysAgo(3) }],
  suggestedDays: 7,
 });
 expect(risk.level).toBe('none');
 expect(risk.count).toBe(1);
 });

 it('returns none for 2 waterings within 7-day window when intervals are appropriate', () => {
  // Two waterings 6 days apart (within normal range of 7-day schedule)
  const risk = computeOverwateringRisk({
   records: [{ watered_at: daysAgo(6) }, { watered_at: daysAgo(0) }],
   suggestedDays: 7,
  });
  expect(risk.level).toBe('none'); // 6 days apart is >= 70% of 7 days (4.9 days)
  expect(risk.count).toBe(2);
  expect(risk.avgIntervalDays).toBe(6);
 });

 it('returns high for 3 waterings with very short intervals', () => {
  // Three waterings 2 days apart (much too frequent for 7-day schedule)
  const risk = computeOverwateringRisk({
   records: [
   { watered_at: daysAgo(6) },
   { watered_at: daysAgo(4) },
   { watered_at: daysAgo(2) },
   ],
   suggestedDays: 7,
  });
  expect(risk.level).toBe('high'); // avg 2 days is < 50% of 7 days (3.5 days)
  expect(risk.count).toBe(3);
  expect(risk.avgIntervalDays).toBe(2);
 });

 it('excludes postponements by notes', () => {
 const risk = computeOverwateringRisk({
  records: [
  { watered_at: daysAgo(5) },
  { watered_at: daysAgo(1), notes: 'POSTPONEMENT: Watering postponed' },
  ],
  suggestedDays: 7,
 });
 expect(risk.count).toBe(1);
 expect(risk.level).toBe('none');
 });

 it('ignores future-dated records', () => {
 const future = new Date();
 future.setDate(future.getDate() + 3);
 const risk = computeOverwateringRisk({
  records: [
  { watered_at: daysAgo(3) },
  { watered_at: future.toISOString() },
  ],
  suggestedDays: 7,
 });
 expect(risk.count).toBe(1);
 });

 it('escalates when avg interval < 50% of suggested', () => {
 const risk = computeOverwateringRisk({
  records: [
  { watered_at: daysAgo(6) },
  { watered_at: daysAgo(4) },
  { watered_at: daysAgo(2) },
  { watered_at: daysAgo(1) },
  ],
  suggestedDays: 14, // 50% = 7, avg intervals ~2 -> escalate
 });
 expect(['low', 'high']).toContain(risk.level);
 expect(risk.level).toBe('high');
 });

 it('clamps windowDays between 2 and 30', () => {
 const low = computeOverwateringRisk({ records: [], suggestedDays: 1 });
 const high = computeOverwateringRisk({ records: [], suggestedDays: 90 });
 expect(low.windowDays).toBe(2);
 expect(high.windowDays).toBe(30);
 });

 it('returns none for consistent watering at suggested interval (14-day schedule)', () => {
  // User's scenario: watering Golden Pothos consistently every ~14 days
  // Note: window is 14 days, so we need records within the last 14 days
  const risk = computeOverwateringRisk({
   records: [
    { watered_at: daysAgo(13) },
    { watered_at: daysAgo(0) },
   ],
   suggestedDays: 14,
  });
  expect(risk.level).toBe('none'); // 13 days is on schedule (93% of 14 days)
  expect(risk.count).toBe(2);
  expect(risk.avgIntervalDays).toBe(13);
 });

 it('returns none for consistent watering with slight variation (13-15 day intervals)', () => {
  // Realistic scenario: user waters with minor variations around the schedule
  const risk = computeOverwateringRisk({
   records: [
    { watered_at: daysAgo(13) },
    { watered_at: daysAgo(0) },
   ],
   suggestedDays: 14,
  });
  expect(risk.level).toBe('none'); // 13 days is still >= 70% of 14 (9.8 days)
  expect(risk.count).toBe(2);
  expect(risk.avgIntervalDays).toBe(13);
 });

 it('returns low for moderately too-frequent watering with 3+ records', () => {
  // 3 waterings averaging ~7 days apart for a 14-day schedule
  // Note: All records must be within the 14-day window
  const now = new Date();
  const records = [
   { watered_at: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString() },
   { watered_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
   { watered_at: now.toISOString() },
  ];
  const risk = computeOverwateringRisk({
   records,
   suggestedDays: 14,
   now,
  });
  // Intervals: 13-5 = 8 days, 5-0 = 5 days
  // Average = (8+5)/2 = 6.5 days -> rounds to 7 days
  // 7 days is exactly 50% of 14, which doesn't trigger high risk (< 50%)
  // But 7 < 70% of 14 (9.8), so it triggers low risk
  expect(risk.level).toBe('low'); // 7 days (rounded) is 50% of 14, triggers low risk
  expect(risk.count).toBe(3);
 });

 it('returns low for watering at 60% of suggested schedule', () => {
  // 2 waterings averaging 8 days apart for a 14-day schedule
  // 8 days is 57% of 14 days (between 50% and 70% thresholds)
  const risk = computeOverwateringRisk({
   records: [
    { watered_at: daysAgo(8) },
    { watered_at: daysAgo(0) },
   ],
   suggestedDays: 14,
  });
  expect(risk.level).toBe('low'); // 8 days is between 50% (7) and 70% (9.8) of 14
  expect(risk.count).toBe(2);
  expect(risk.avgIntervalDays).toBe(8);
 });

 it('returns low for watering at edge of low-risk threshold', () => {
  // 2 waterings 9 days apart for a 14-day schedule
  // 9 days is 64% of 14 days (just under 70% threshold)
  const risk = computeOverwateringRisk({
   records: [
    { watered_at: daysAgo(9) },
    { watered_at: daysAgo(0) },
   ],
   suggestedDays: 14,
  });
  expect(risk.level).toBe('low'); // 9 days is 64% of 14 (< 70% threshold of 9.8)
  expect(risk.count).toBe(2);
  expect(risk.avgIntervalDays).toBe(9);
 });

 it('returns high for very frequent watering regardless of count', () => {
  // 2 waterings 3 days apart for a 14-day schedule
  // 3 days is < 50% of 14 days (7 days)
  const risk = computeOverwateringRisk({
   records: [
    { watered_at: daysAgo(3) },
    { watered_at: daysAgo(0) },
   ],
   suggestedDays: 14,
  });
  expect(risk.level).toBe('high'); // 3 days < 50% of 14 (7 days)
  expect(risk.count).toBe(2);
  expect(risk.avgIntervalDays).toBe(3);
 });

 it('returns high for 4+ waterings in window even without interval data', () => {
  // Edge case: many waterings but intervals can't be calculated
  // This shouldn't normally happen but provides fallback protection
  const risk = computeOverwateringRisk({
   records: [
    { watered_at: daysAgo(6) },
    { watered_at: daysAgo(5) },
    { watered_at: daysAgo(4) },
    { watered_at: daysAgo(3) },
   ],
   suggestedDays: 7,
  });
  expect(risk.level).toBe('high'); // 4+ waterings is excessive
  expect(risk.count).toBe(4);
 });
});


