/**
 * Tests for the canonical watering schedule calculation.
 *
 * These cover the invariants that previously drifted between the UI, the analytics page
 * and the push-notification job.
 */

import { describe, it, expect } from 'vitest';
import {
    calculateWateringSchedule,
    getDaysSince,
    getDaysBetweenCalendarDays,
    getWateringIntervalDays,
    DEFAULT_WATERING_DAYS,
} from '../watering/schedule';

/** Builds an ISO timestamp N days before the given reference, preserving time of day. */
function daysBefore(reference: Date, days: number): string {
    const d = new Date(reference);
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function daysAfter(reference: Date, days: number): string {
    return daysBefore(reference, -days);
}

const NOW = new Date('2026-06-15T15:00:00Z');

describe('calculateWateringSchedule', () => {
    it('reports an unknown schedule when the plant has never been watered', () => {
        const result = calculateWateringSchedule(
            { latest_watering: null, suggested_watering_days: 7 },
            { now: NOW }
        );

        expect(result.hasUnknownWateringDate).toBe(true);
        // null rather than a sentinel, so callers cannot accidentally sort or compare it
        expect(result.daysUntilWatering).toBeNull();
        expect(result.isOverdue).toBe(false);
        expect(result.isPostponed).toBe(false);
    });

    it('treats an unparseable timestamp as unknown rather than throwing', () => {
        const result = calculateWateringSchedule(
            { latest_watering: 'not a date', suggested_watering_days: 7 },
            { now: NOW }
        );

        expect(result.hasUnknownWateringDate).toBe(true);
        expect(result.daysUntilWatering).toBeNull();
    });

    it('counts down to the due date', () => {
        const result = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, 3), suggested_watering_days: 7 },
            { now: NOW }
        );

        expect(result.daysUntilWatering).toBe(4);
        expect(result.isOverdue).toBe(false);
    });

    it('is due today exactly one interval after watering', () => {
        const result = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, 7), suggested_watering_days: 7 },
            { now: NOW }
        );

        expect(result.daysUntilWatering).toBe(0);
        expect(result.isOverdue).toBe(false);
    });

    it('is not overdue until a full day past the due date', () => {
        const dueToday = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, 7), suggested_watering_days: 7 },
            { now: NOW }
        );
        const oneDayLate = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, 8), suggested_watering_days: 7 },
            { now: NOW }
        );

        expect(dueToday.isOverdue).toBe(false);
        expect(oneDayLate.isOverdue).toBe(true);
        expect(oneDayLate.daysUntilWatering).toBe(-1);
    });

    it('falls back to the default interval when none is set', () => {
        const result = calculateWateringSchedule(
            { latest_watering: daysBefore(NOW, DEFAULT_WATERING_DAYS) },
            { now: NOW }
        );

        expect(result.daysUntilWatering).toBe(0);
    });

    describe('postponement', () => {
        it('defers the due date while the postponement is pending', () => {
            const result = calculateWateringSchedule(
                {
                    latest_watering: daysBefore(NOW, 10),
                    suggested_watering_days: 7,
                    postponement_date: daysAfter(NOW, 1),
                },
                { now: NOW }
            );

            expect(result.isPostponed).toBe(true);
            expect(result.isOverdue).toBe(false);
            expect(result.daysUntilWatering).toBe(1);
        });

        it('is due today once the postponement date arrives', () => {
            const result = calculateWateringSchedule(
                {
                    latest_watering: daysBefore(NOW, 10),
                    suggested_watering_days: 7,
                    postponement_date: NOW.toISOString(),
                },
                { now: NOW }
            );

            expect(result.isPostponed).toBe(false);
            expect(result.isOverdue).toBe(false);
            expect(result.daysUntilWatering).toBe(0);
        });

        it('becomes overdue after the postponement lapses', () => {
            // Regression: a lapsed postponement used to pin the plant to "Due today" forever,
            // so it could never go overdue and never triggered a reminder.
            const result = calculateWateringSchedule(
                {
                    latest_watering: daysBefore(NOW, 20),
                    suggested_watering_days: 7,
                    postponement_date: daysBefore(NOW, 5),
                },
                { now: NOW }
            );

            expect(result.isPostponed).toBe(false);
            expect(result.isOverdue).toBe(true);
            expect(result.daysUntilWatering).toBe(-5);
        });

        it('ignores an unparseable postponement date and uses the schedule', () => {
            const result = calculateWateringSchedule(
                {
                    latest_watering: daysBefore(NOW, 3),
                    suggested_watering_days: 7,
                    postponement_date: 'garbage',
                },
                { now: NOW }
            );

            expect(result.isPostponed).toBe(false);
            expect(result.daysUntilWatering).toBe(4);
        });
    });

    describe('timezone handling', () => {
        it('resolves the calendar day in the supplied timezone', () => {
            // 01:00 UTC on the 15th is still the evening of the 14th in New York.
            const wateredAt = '2026-06-15T01:00:00Z';
            const evaluatedAt = new Date('2026-06-22T01:00:00Z');

            const inUtc = calculateWateringSchedule(
                { latest_watering: wateredAt, suggested_watering_days: 7 },
                { now: evaluatedAt, timeZone: 'UTC' }
            );
            const inNewYork = calculateWateringSchedule(
                { latest_watering: wateredAt, suggested_watering_days: 7 },
                { now: evaluatedAt, timeZone: 'America/New_York' }
            );

            // Both see exactly 7 elapsed calendar days, so both are due today. The point is
            // that the timezone is applied consistently to both ends of the comparison.
            expect(inUtc.daysUntilWatering).toBe(0);
            expect(inNewYork.daysUntilWatering).toBe(0);
        });

        it('does not report a plant as due a day early in a western timezone', () => {
            // Watered 22:00 local on the 14th in Los Angeles = 05:00 UTC on the 15th.
            const wateredAt = '2026-06-15T05:00:00Z';
            // Evaluated 20:00 local on the 21st in LA = 03:00 UTC on the 22nd.
            const evaluatedAt = new Date('2026-06-22T03:00:00Z');

            const inLosAngeles = calculateWateringSchedule(
                { latest_watering: wateredAt, suggested_watering_days: 7 },
                { now: evaluatedAt, timeZone: 'America/Los_Angeles' }
            );

            // Locally it is the 14th -> the 21st, which is 7 days, so due today, not overdue.
            expect(inLosAngeles.daysUntilWatering).toBe(0);
            expect(inLosAngeles.isOverdue).toBe(false);
        });
    });
});

describe('getDaysSince', () => {
    it('returns null for missing input', () => {
        expect(getDaysSince(null)).toBeNull();
        expect(getDaysSince(undefined)).toBeNull();
    });

    it('returns null for unparseable input', () => {
        expect(getDaysSince('nonsense')).toBeNull();
    });

    it('counts calendar days, not elapsed hours', () => {
        // Only 2 hours apart, but they fall on different calendar days in UTC.
        const days = getDaysSince('2026-06-14T23:00:00Z', {
            now: new Date('2026-06-15T01:00:00Z'),
            timeZone: 'UTC',
        });

        expect(days).toBe(1);
    });

    it('returns 0 for a watering earlier the same day', () => {
        const days = getDaysSince('2026-06-15T01:00:00Z', {
            now: new Date('2026-06-15T23:00:00Z'),
            timeZone: 'UTC',
        });

        expect(days).toBe(0);
    });
});

describe('getDaysBetweenCalendarDays', () => {
    it('is signed, preserving direction', () => {
        const earlier = new Date('2026-06-10T12:00:00Z');
        const later = new Date('2026-06-15T12:00:00Z');

        expect(getDaysBetweenCalendarDays(earlier, later, 'UTC')).toBe(5);
        expect(getDaysBetweenCalendarDays(later, earlier, 'UTC')).toBe(-5);
    });

    it('spans a DST transition without drifting', () => {
        // US DST begins 2026-03-08. Midday avoids the ambiguous hour.
        const before = new Date('2026-03-06T17:00:00Z');
        const after = new Date('2026-03-11T17:00:00Z');

        expect(getDaysBetweenCalendarDays(before, after, 'America/New_York')).toBe(5);
    });
});

describe('getWateringIntervalDays', () => {
    it('uses the plant schedule when set', () => {
        expect(getWateringIntervalDays({ suggested_watering_days: 21 })).toBe(21);
    });

    it('falls back to the default for missing or invalid values', () => {
        expect(getWateringIntervalDays({})).toBe(DEFAULT_WATERING_DAYS);
        expect(getWateringIntervalDays({ suggested_watering_days: null })).toBe(
            DEFAULT_WATERING_DAYS
        );
        expect(getWateringIntervalDays({ suggested_watering_days: 0 })).toBe(
            DEFAULT_WATERING_DAYS
        );
    });
});
