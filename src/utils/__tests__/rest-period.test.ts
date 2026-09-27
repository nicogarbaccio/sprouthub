/**
 * Tests for rest periods: which season a species rests in, and how a paused plant's schedule
 * and status behave before, during and after the pause.
 */

import { describe, it, expect } from 'vitest';
import { calculateWateringSchedule } from '../watering/schedule';
import { getWateringStatus } from '../watering/status';
import { getActiveRestPeriod, parseDateOnly, restSuggestionKey, toDateOnly } from '../watering/restPeriod';

const NOW = new Date('2027-01-10T15:00:00Z'); // northern winter
const LITHOPS_RESTS = [
    { season: 'winter' as const, note: 'No water.' },
    { season: 'summer' as const, note: 'Dormant.' },
];

function daysBefore(reference: Date, days: number): string {
    const d = new Date(reference);
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

describe('getActiveRestPeriod', () => {
    it('finds the current season\'s rest and when it ends', () => {
        const period = getActiveRestPeriod(LITHOPS_RESTS, 'northern', NOW)!;
        expect(period.season).toBe('winter');
        expect(toDateOnly(period.endsOn)).toBe('2027-03-20');
        expect(restSuggestionKey(period)).toBe('rest_suggestion:winter-2027');
    });

    it('flips with the hemisphere', () => {
        // January is summer in the southern hemisphere, which is also a Lithops rest
        expect(getActiveRestPeriod(LITHOPS_RESTS, 'southern', NOW)!.season).toBe('summer');
        expect(getActiveRestPeriod([{ season: 'winter', note: '' }], 'southern', NOW)).toBeNull();
    });

    it('is null for plants without rest periods', () => {
        expect(getActiveRestPeriod(undefined, 'northern', NOW)).toBeNull();
    });
});

describe('parseDateOnly', () => {
    it('keeps the calendar day in any timezone', () => {
        expect(parseDateOnly('2027-03-20')!.toISOString()).toBe('2027-03-20T12:00:00.000Z');
        expect(parseDateOnly('not a date')).toBeNull();
        expect(parseDateOnly(null)).toBeNull();
    });
});

describe('rest pause in the watering schedule', () => {
    const lastWatered = daysBefore(NOW, 40); // 26 days overdue on a 14-day schedule

    it('is never due or overdue while resting, and is due the day the rest ends', () => {
        const calc = calculateWateringSchedule(
            { latest_watering: lastWatered, suggested_watering_days: 14, watering_paused_until: '2027-03-20' },
            { now: NOW }
        );
        expect(calc.isResting).toBe(true);
        expect(calc.isOverdue).toBe(false);
        expect(calc.daysUntilWatering).toBe(69);
        expect(toDateOnly(calc.restUntil!)).toBe(toDateOnly(parseDateOnly('2027-03-20')!));
        expect(getWateringStatus(calc, lastWatered, NOW).text).toBe('Resting until Mar 20');
    });

    it('counts overdue from the end of the rest, not the last watering', () => {
        const afterRest = new Date('2027-03-23T15:00:00Z');
        const calc = calculateWateringSchedule(
            { latest_watering: lastWatered, suggested_watering_days: 14, watering_paused_until: '2027-03-20' },
            { now: afterRest }
        );
        expect(calc.isResting).toBe(false);
        expect(calc.isOverdue).toBe(true);
        expect(calc.daysUntilWatering).toBe(-3);
    });

    it('ignores a pause that ended before the last watering', () => {
        const calc = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, 3), suggested_watering_days: 7, watering_paused_until: '2026-12-01' },
            { now: NOW }
        );
        expect(calc.isResting).toBe(false);
        expect(calc.daysUntilWatering).toBe(4);
    });

    it('does not pull the due date earlier when the plant is due after the rest anyway', () => {
        const calc = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, 1), suggested_watering_days: 90, watering_paused_until: '2027-01-20' },
            { now: NOW }
        );
        expect(calc.isResting).toBe(true);
        expect(calc.daysUntilWatering).toBe(89);
    });

    it('marks a never-watered plant as resting while paused', () => {
        const calc = calculateWateringSchedule(
            { latest_watering: null, watering_paused_until: '2027-03-20' },
            { now: NOW }
        );
        expect(calc.isResting).toBe(true);
        expect(calc.hasUnknownWateringDate).toBe(true);
        expect(getWateringStatus(calc).text).toBe('Resting until Mar 20');
    });

    it('agrees on the day in a timezone far from UTC, as the push job runs', () => {
        const calc = calculateWateringSchedule(
            { latest_watering: lastWatered, suggested_watering_days: 14, watering_paused_until: '2027-01-11' },
            { now: new Date('2027-01-11T06:00:00Z'), timeZone: 'America/Los_Angeles' } // still Jan 10 in LA
        );
        expect(calc.isResting).toBe(true);
        expect(calc.daysUntilWatering).toBe(1);
    });
});
