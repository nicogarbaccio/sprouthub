/**
 * Tests for the canonical fertilization due-ness rule.
 *
 * The banner, the room cards, the plant detail page and the analytics table all resolve
 * through getFertilizationStatus now. These cover the per-plant interval behaviour and the
 * two dead ends the old implementation had.
 */

import { describe, it, expect } from 'vitest';
import {
    getFertilizationStatus,
    DEFAULT_FERTILIZATION_WEEKS,
    type FertilizationAdvice,
} from '../plants/fertilizationAdvice';

/** Northern-hemisphere summer. */
const IN_GROWING_SEASON = new Date('2026-07-15T12:00:00Z');
/** Northern-hemisphere winter. */
const IN_DORMANCY = new Date('2026-01-15T12:00:00Z');

const NORTHERN_LATITUDE = 40;
const SOUTHERN_LATITUDE = -33;

function adviceWithFrequency(
    frequencyWeeks: [number, number] | null
): FertilizationAdvice {
    return {
        rawTip: null,
        frequencyWeeks,
        frequencyLabel: 'test',
        fertilizerType: null,
        source: 'category_fallback',
    };
}

/** ISO timestamp N days before the reference date. */
function daysBefore(reference: Date, days: number): string {
    const d = new Date(reference);
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

describe('getFertilizationStatus', () => {
    it('is due when never fertilized during the growing season', () => {
        const status = getFertilizationStatus(
            { last_fertilized_at: null },
            adviceWithFrequency([4, 4]),
            IN_GROWING_SEASON,
            NORTHERN_LATITUDE
        );

        expect(status.isDue).toBe(true);
        expect(status.daysSinceLastFertilized).toBeNull();
        expect(status.daysUntilDue).toBeNull();
    });

    it('respects a short per-plant interval', () => {
        // A 2-3 week feeder is due at day 21, not at some flat 60-day threshold.
        const advice = adviceWithFrequency([2, 3]);

        const atDay20 = getFertilizationStatus(
            { last_fertilized_at: daysBefore(IN_GROWING_SEASON, 20) },
            advice,
            IN_GROWING_SEASON,
            NORTHERN_LATITUDE
        );
        const atDay21 = getFertilizationStatus(
            { last_fertilized_at: daysBefore(IN_GROWING_SEASON, 21) },
            advice,
            IN_GROWING_SEASON,
            NORTHERN_LATITUDE
        );

        expect(atDay20.isDue).toBe(false);
        expect(atDay20.daysUntilDue).toBe(1);
        expect(atDay21.isDue).toBe(true);
        expect(atDay21.intervalDays).toBe(21);
    });

    it('respects a long per-plant interval', () => {
        // An 8-12 week feeder is NOT due at day 61, which the old flat 60-day rule got wrong.
        const status = getFertilizationStatus(
            { last_fertilized_at: daysBefore(IN_GROWING_SEASON, 61) },
            adviceWithFrequency([8, 12]),
            IN_GROWING_SEASON,
            NORTHERN_LATITUDE
        );

        expect(status.isDue).toBe(false);
        expect(status.intervalDays).toBe(84);
        expect(status.daysUntilDue).toBe(23);
    });

    it('falls back to a default interval when frequency cannot be parsed', () => {
        // Regression: a null frequency used to leave isDue false forever, so these plants were
        // silently never flagged.
        const status = getFertilizationStatus(
            { last_fertilized_at: daysBefore(IN_GROWING_SEASON, 60) },
            adviceWithFrequency(null),
            IN_GROWING_SEASON,
            NORTHERN_LATITUDE
        );

        expect(status.intervalDays).toBe(DEFAULT_FERTILIZATION_WEEKS * 7);
        expect(status.isDue).toBe(true);
    });

    describe('dormancy', () => {
        it('is never due outside the growing season', () => {
            const status = getFertilizationStatus(
                { last_fertilized_at: daysBefore(IN_DORMANCY, 200) },
                adviceWithFrequency([4, 4]),
                IN_DORMANCY,
                NORTHERN_LATITUDE
            );

            expect(status.isGrowingSeason).toBe(false);
            expect(status.isDue).toBe(false);
            // ...but still reports that the interval has elapsed, so the UI can explain why.
            expect(status.isIntervalElapsed).toBe(true);
        });

        it('still reports a countdown outside the growing season', () => {
            // Regression: daysUntilDue used to be gated behind isGrowingSeason, so in fall and
            // winter the UI could not say anything at all.
            const status = getFertilizationStatus(
                { last_fertilized_at: daysBefore(IN_DORMANCY, 10) },
                adviceWithFrequency([4, 4]),
                IN_DORMANCY,
                NORTHERN_LATITUDE
            );

            expect(status.isGrowingSeason).toBe(false);
            expect(status.daysUntilDue).toBe(18);
        });
    });

    describe('hemisphere', () => {
        it('treats July as dormancy in the southern hemisphere', () => {
            const status = getFertilizationStatus(
                { last_fertilized_at: null },
                adviceWithFrequency([4, 4]),
                IN_GROWING_SEASON,
                SOUTHERN_LATITUDE
            );

            expect(status.isGrowingSeason).toBe(false);
            expect(status.isDue).toBe(false);
        });

        it('treats January as growing season in the southern hemisphere', () => {
            const status = getFertilizationStatus(
                { last_fertilized_at: null },
                adviceWithFrequency([4, 4]),
                IN_DORMANCY,
                SOUTHERN_LATITUDE
            );

            expect(status.isGrowingSeason).toBe(true);
            expect(status.isDue).toBe(true);
        });
    });
});
