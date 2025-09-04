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

 it('returns low for 2 waterings within 7-day window', () => {
 const risk = computeOverwateringRisk({
  records: [{ watered_at: daysAgo(6) }, { watered_at: daysAgo(2) }],
  suggestedDays: 7,
 });
 expect(risk.level).toBe('low');
 expect(risk.count).toBe(2);
 });

 it('returns high for 3 waterings within 7-day window', () => {
 const risk = computeOverwateringRisk({
  records: [
  { watered_at: daysAgo(6) },
  { watered_at: daysAgo(4) },
  { watered_at: daysAgo(1) },
  ],
  suggestedDays: 7,
 });
 expect(risk.level).toBe('high');
 expect(risk.count).toBe(3);
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
});


