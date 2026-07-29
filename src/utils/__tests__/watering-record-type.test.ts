/**
 * Tests for watering record classification.
 *
 * `record_type` replaced a `POSTPONEMENT:` substring in free-text notes. The fallback to that
 * marker is deliberate but subtle, so it is pinned down here: rows written by a client that
 * predates the column still classify correctly, and a user typing the marker into a real note
 * can no longer be misread once the column is set.
 */

import { describe, it, expect } from 'vitest';
import {
    isPostponementRecord,
    excludePostponements,
    WATERING_RECORD_TYPE,
    POSTPONEMENT_PREFIX,
} from '../watering/notesPrefixes';

describe('isPostponementRecord', () => {
    it('classifies by record_type when present', () => {
        expect(
            isPostponementRecord({ record_type: WATERING_RECORD_TYPE.postponement })
        ).toBe(true);
        expect(
            isPostponementRecord({ record_type: WATERING_RECORD_TYPE.watering })
        ).toBe(false);
    });

    it('treats record_type as authoritative over the notes marker', () => {
        // A user typing "POSTPONEMENT:" into a genuine watering note was previously misread as a
        // postponement. With the column set, the note text no longer decides.
        expect(
            isPostponementRecord({
                record_type: WATERING_RECORD_TYPE.watering,
                notes: 'POSTPONEMENT: this is just something I typed',
            })
        ).toBe(false);
    });

    it('falls back to the notes marker when record_type is absent', () => {
        // Covers rows written by a stale client that predates the column.
        expect(
            isPostponementRecord({ notes: `${POSTPONEMENT_PREFIX} soil still moist` })
        ).toBe(true);
        expect(isPostponementRecord({ notes: 'Watered thoroughly' })).toBe(false);
    });

    it('falls back when record_type is null or empty', () => {
        expect(
            isPostponementRecord({ record_type: null, notes: POSTPONEMENT_PREFIX })
        ).toBe(true);
        expect(
            isPostponementRecord({ record_type: '', notes: POSTPONEMENT_PREFIX })
        ).toBe(true);
    });

    it('treats a record with neither signal as a real watering', () => {
        expect(isPostponementRecord({})).toBe(false);
        expect(isPostponementRecord({ notes: null })).toBe(false);
    });
});

describe('excludePostponements', () => {
    it('keeps only real waterings', () => {
        const records = [
            { id: 'w1', record_type: WATERING_RECORD_TYPE.watering },
            { id: 'p1', record_type: WATERING_RECORD_TYPE.postponement },
            { id: 'w2', notes: 'Watered' },
            { id: 'p2', notes: `${POSTPONEMENT_PREFIX} not yet` },
        ];

        expect(excludePostponements(records).map(r => r.id)).toEqual(['w1', 'w2']);
    });

    it('returns an empty list when everything is a postponement', () => {
        const records = [{ record_type: WATERING_RECORD_TYPE.postponement }];

        expect(excludePostponements(records)).toHaveLength(0);
    });

    it('leaves an empty input untouched', () => {
        expect(excludePostponements([])).toEqual([]);
    });
});
