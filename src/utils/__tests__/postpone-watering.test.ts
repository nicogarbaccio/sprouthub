/**
 * Tests for the shared postponement helpers.
 *
 * The date and notes logic used to be duplicated in two hooks with different signatures — one
 * took a day count, the other an absolute Date. These cover the unified behaviour.
 */

import { describe, it, expect } from 'vitest';
import {
    resolvePostponementDate,
    buildPostponementNotes,
    getPendingPostponementCutoff,
} from '../watering/postponeWatering';
import { POSTPONEMENT_PREFIX } from '../watering/notesPrefixes';

const NOW = new Date('2026-06-15T14:30:00');

describe('resolvePostponementDate', () => {
    it('defers by the requested number of days', () => {
        const result = resolvePostponementDate(3, NOW);

        expect(result.getDate()).toBe(18);
        expect(result.getMonth()).toBe(5);
    });

    it('lands on 9 AM regardless of the current time', () => {
        // A consistent hour keeps the day-granularity comparisons in calculateWateringSchedule
        // stable no matter when the user tapped postpone.
        const result = resolvePostponementDate(1, NOW);

        expect(result.getHours()).toBe(9);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
    });

    it('defaults to tomorrow for a single day', () => {
        const result = resolvePostponementDate(1, NOW);

        expect(result.getDate()).toBe(16);
    });

    it('never defers by less than a day', () => {
        // A zero or negative deferral would leave the plant due, making the action a no-op.
        expect(resolvePostponementDate(0, NOW).getDate()).toBe(16);
        expect(resolvePostponementDate(-5, NOW).getDate()).toBe(16);
    });

    it('rounds fractional days', () => {
        expect(resolvePostponementDate(2.4, NOW).getDate()).toBe(17);
        expect(resolvePostponementDate(2.6, NOW).getDate()).toBe(18);
    });

    it('rolls over month boundaries', () => {
        const endOfMonth = new Date('2026-06-29T14:30:00');
        const result = resolvePostponementDate(3, endOfMonth);

        expect(result.getMonth()).toBe(6); // July
        expect(result.getDate()).toBe(2);
    });
});

describe('buildPostponementNotes', () => {
    it('includes the supplied reason', () => {
        const notes = buildPostponementNotes('Rain expected');

        expect(notes).toContain('Rain expected');
        expect(notes).toContain(POSTPONEMENT_PREFIX);
    });

    it('falls back to a default reason', () => {
        const notes = buildPostponementNotes();

        expect(notes).toContain(POSTPONEMENT_PREFIX);
        expect(notes).toContain("didn't need water yet");
    });

    it('treats an empty reason as absent', () => {
        expect(buildPostponementNotes('')).toBe(buildPostponementNotes());
    });

    it('always starts with the prefix so legacy readers still classify it', () => {
        // The prefix is retained alongside record_type for human readability and for any client
        // that predates the column.
        expect(buildPostponementNotes('Rain expected').startsWith(POSTPONEMENT_PREFIX)).toBe(true);
    });
});

describe('getPendingPostponementCutoff', () => {
    it('is the start of tomorrow', () => {
        const cutoff = getPendingPostponementCutoff(NOW);

        expect(cutoff.getDate()).toBe(16);
        expect(cutoff.getHours()).toBe(0);
        expect(cutoff.getMinutes()).toBe(0);
    });

    it('treats a postponement landing later today as lapsed', () => {
        // Regression: postponed yesterday to today at 9 AM, then re-postponed at 7 AM today. The
        // plant shows as due, so the earlier postponement must not block a new one.
        const morning = new Date('2026-06-15T07:00:00');
        const landsToday = resolvePostponementDate(1, new Date('2026-06-14T18:00:00'));

        expect(landsToday.getTime()).toBeGreaterThan(morning.getTime());
        expect(landsToday.getTime()).toBeLessThan(getPendingPostponementCutoff(morning).getTime());
    });

    it('treats a postponement landing tomorrow as pending', () => {
        const landsTomorrow = resolvePostponementDate(1, NOW);

        expect(landsTomorrow.getTime()).toBeGreaterThanOrEqual(
            getPendingPostponementCutoff(NOW).getTime()
        );
    });
});
