/**
 * Tests for canonical season detection and hemisphere resolution.
 *
 * These lock down the behavior that five separate implementations previously disagreed on.
 */

import { describe, it, expect } from 'vitest';
import {
    getSeason,
    getSeasonForLocation,
    getNextSeasonChange,
    isGrowingSeason,
    resolveHemisphere,
    isSouthernTimeZone,
    formatSeasonName,
} from '../season';

describe('getSeason', () => {
    it('returns opposite seasons for the two hemispheres on the same date', () => {
        // Mid-July: northern summer, southern winter.
        const july = new Date(2026, 6, 15);

        expect(getSeason(july, 'northern')).toBe('summer');
        expect(getSeason(july, 'southern')).toBe('winter');
    });

    it('inverts every season between hemispheres', () => {
        const dates: { date: Date; northern: string; southern: string }[] = [
            { date: new Date(2026, 3, 15), northern: 'spring', southern: 'fall' },
            { date: new Date(2026, 6, 15), northern: 'summer', southern: 'winter' },
            { date: new Date(2026, 9, 15), northern: 'fall', southern: 'spring' },
            { date: new Date(2026, 0, 15), northern: 'winter', southern: 'summer' },
        ];

        for (const { date, northern, southern } of dates) {
            expect(getSeason(date, 'northern')).toBe(northern);
            expect(getSeason(date, 'southern')).toBe(southern);
        }
    });

    it('uses equinox boundaries rather than whole months', () => {
        // March 19 is still winter; March 20 is spring. A month-based implementation would call
        // all of March spring, which is what the old derivations did.
        expect(getSeason(new Date(2026, 2, 19), 'northern')).toBe('winter');
        expect(getSeason(new Date(2026, 2, 20), 'northern')).toBe('spring');

        // Likewise December 20 vs 21.
        expect(getSeason(new Date(2026, 11, 20), 'northern')).toBe('fall');
        expect(getSeason(new Date(2026, 11, 21), 'northern')).toBe('winter');
    });
});

describe('isGrowingSeason', () => {
    it('treats spring and summer as the growing season', () => {
        expect(isGrowingSeason('spring')).toBe(true);
        expect(isGrowingSeason('summer')).toBe(true);
        expect(isGrowingSeason('fall')).toBe(false);
        expect(isGrowingSeason('winter')).toBe(false);
    });
});

describe('resolveHemisphere', () => {
    it('prefers latitude when available', () => {
        const result = resolveHemisphere({ latitude: -33.87, timeZone: 'Europe/London' });

        expect(result.hemisphere).toBe('southern');
        expect(result.source).toBe('latitude');
        expect(result.isAssumed).toBe(false);
    });

    it('treats the equator as northern', () => {
        expect(resolveHemisphere({ latitude: 0 }).hemisphere).toBe('northern');
    });

    it('falls back to timezone inference when latitude is missing', () => {
        const result = resolveHemisphere({ timeZone: 'Australia/Sydney' });

        expect(result.hemisphere).toBe('southern');
        expect(result.source).toBe('timezone');
        expect(result.isAssumed).toBe(false);
    });

    it('infers northern from a northern timezone', () => {
        const result = resolveHemisphere({ timeZone: 'America/New_York' });

        expect(result.hemisphere).toBe('northern');
        expect(result.source).toBe('timezone');
    });

    it('flags the northern assumption when nothing is available', () => {
        const result = resolveHemisphere({});

        expect(result.hemisphere).toBe('northern');
        expect(result.source).toBe('assumed');
        // The point of the whole fallback chain: an assumption must be detectable.
        expect(result.isAssumed).toBe(true);
    });

    it('ignores a non-finite latitude and falls through', () => {
        const result = resolveHemisphere({ latitude: NaN, timeZone: 'Australia/Perth' });

        expect(result.source).toBe('timezone');
        expect(result.hemisphere).toBe('southern');
    });
});

describe('isSouthernTimeZone', () => {
    it('recognises southern zones by prefix', () => {
        expect(isSouthernTimeZone('Australia/Brisbane')).toBe(true);
        expect(isSouthernTimeZone('America/Argentina/Cordoba')).toBe(true);
        expect(isSouthernTimeZone('Antarctica/Casey')).toBe(true);
    });

    it('recognises individually listed southern zones', () => {
        expect(isSouthernTimeZone('Pacific/Auckland')).toBe(true);
        expect(isSouthernTimeZone('America/Sao_Paulo')).toBe(true);
        expect(isSouthernTimeZone('Africa/Johannesburg')).toBe(true);
        expect(isSouthernTimeZone('America/Santiago')).toBe(true);
    });

    it('does not misclassify northern zones', () => {
        expect(isSouthernTimeZone('Europe/London')).toBe(false);
        expect(isSouthernTimeZone('America/New_York')).toBe(false);
        expect(isSouthernTimeZone('Asia/Tokyo')).toBe(false);
        // Northern-hemisphere Africa must not be caught by a broad Africa/ match.
        expect(isSouthernTimeZone('Africa/Cairo')).toBe(false);
        expect(isSouthernTimeZone('Africa/Lagos')).toBe(false);
    });
});

describe('getSeasonForLocation', () => {
    it('resolves hemisphere and season together', () => {
        const result = getSeasonForLocation({
            latitude: -33.87,
            date: new Date(2026, 6, 15),
        });

        expect(result.season).toBe('winter');
        expect(result.hemisphere).toBe('southern');
        expect(result.isAssumedHemisphere).toBe(false);
    });

    it('reports when the hemisphere was assumed', () => {
        const result = getSeasonForLocation({ date: new Date(2026, 6, 15) });

        expect(result.isAssumedHemisphere).toBe(true);
    });
});

describe('getNextSeasonChange', () => {
    it('finds the next boundary within the year', () => {
        const { date, season } = getNextSeasonChange(new Date(2026, 3, 1), 'northern');

        expect(season).toBe('summer');
        expect(date.getMonth()).toBe(5);
        expect(date.getDate()).toBe(21);
    });

    it('wraps to the following year past the last boundary', () => {
        const { date } = getNextSeasonChange(new Date(2026, 11, 25), 'northern');

        expect(date.getFullYear()).toBe(2027);
    });

    it('returns a future date for the southern hemisphere too', () => {
        const from = new Date(2026, 3, 1);
        const { date } = getNextSeasonChange(from, 'southern');

        expect(date.getTime()).toBeGreaterThan(from.getTime());
    });
});

describe('formatSeasonName', () => {
    it('title-cases the season', () => {
        expect(formatSeasonName('spring')).toBe('Spring');
        expect(formatSeasonName('winter')).toBe('Winter');
    });
});
