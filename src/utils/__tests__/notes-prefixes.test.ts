/**
 * Editing a record's notes shows the user only their own text, so saving has to put the
 * system prefix back or the health observation / postponement marker is silently lost.
 */

import { describe, it, expect } from 'vitest';
import {
    replaceNotesText,
    stripNotesPrefixes,
    parseHealthObservation,
    LATE_HEALTHY_PREFIX,
    LATE_STRESSED_PREFIX,
    POSTPONEMENT_PREFIX,
} from '../watering/notesPrefixes';

describe('replaceNotesText', () => {
    it('keeps the health observation prefix when the text changes', () => {
        const saved = replaceNotesText(`${LATE_HEALTHY_PREFIX} soil was dry`, 'soil was bone dry');
        expect(saved).toBe(`${LATE_HEALTHY_PREFIX} soil was bone dry`);
        expect(parseHealthObservation(saved)).toBe('healthy');
    });

    it('keeps the prefix alone when the text is cleared', () => {
        expect(replaceNotesText(`${LATE_STRESSED_PREFIX} wilting`, '   ')).toBe(LATE_STRESSED_PREFIX);
    });

    it('keeps the postponement marker', () => {
        expect(replaceNotesText(`${POSTPONEMENT_PREFIX} still moist`, 'checked, still moist')).toBe(
            `${POSTPONEMENT_PREFIX} checked, still moist`
        );
    });

    it('stores plain notes as typed, and null when empty', () => {
        expect(replaceNotesText('first note', '  new note ')).toBe('new note');
        expect(replaceNotesText(null, '')).toBeNull();
    });

    it('round-trips with stripNotesPrefixes', () => {
        const original = `${LATE_HEALTHY_PREFIX} looked fine`;
        expect(replaceNotesText(original, stripNotesPrefixes(original))).toBe(original);
    });
});
