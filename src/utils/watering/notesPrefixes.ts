/**
 * Prefix constants and helpers for structured data encoded in watering record notes.
 *
 * Convention mirrors the existing POSTPONEMENT: pattern. Prefixes are system-generated
 * and should be stripped before displaying notes to the user.
 */

export const LATE_HEALTHY_PREFIX = 'LATE_HEALTHY:';
export const LATE_STRESSED_PREFIX = 'LATE_STRESSED:';
export const POSTPONEMENT_PREFIX = 'POSTPONEMENT:';

/**
 * Assembles the final notes string to store on a watering record.
 * Prepends a health observation prefix when the user indicated how their
 * plant looked during a late watering.
 */
export function buildWateringNotes(
  observation: 'healthy' | 'stressed' | null,
  userNotes: string
): string | null {
  const trimmed = userNotes.trim();

  if (observation === 'healthy') {
    return trimmed ? `${LATE_HEALTHY_PREFIX} ${trimmed}` : LATE_HEALTHY_PREFIX;
  }
  if (observation === 'stressed') {
    return trimmed ? `${LATE_STRESSED_PREFIX} ${trimmed}` : LATE_STRESSED_PREFIX;
  }

  return trimmed || null;
}

/**
 * Reads a health observation back from a stored notes string.
 * Returns null for records with no observation prefix (on-time waterings,
 * "didn't check" selections, or old records that predate this feature).
 */
export function parseHealthObservation(
  notes: string | null | undefined
): 'healthy' | 'stressed' | null {
  if (!notes) return null;
  if (notes.startsWith(LATE_HEALTHY_PREFIX)) return 'healthy';
  if (notes.startsWith(LATE_STRESSED_PREFIX)) return 'stressed';
  return null;
}

/**
 * Strips any system-generated prefix from a notes string for display purposes.
 */
export function stripNotesPrefixes(notes: string | null | undefined): string {
  if (!notes) return '';
  for (const prefix of [LATE_HEALTHY_PREFIX, LATE_STRESSED_PREFIX, POSTPONEMENT_PREFIX]) {
    if (notes.startsWith(prefix)) {
      return notes.slice(prefix.length).trim();
    }
  }
  return notes;
}

/**
 * Discriminator values for the `watering_records.record_type` column.
 *
 * Postponements are stored as rows in `watering_records` dated in the future. Every query that
 * derives watering intervals, streaks, counts or averages MUST exclude them — a postponement is
 * the user saying they did *not* water.
 */
export const WATERING_RECORD_TYPE = {
  watering: 'watering',
  postponement: 'postponement',
} as const;

export type WateringRecordType =
  (typeof WATERING_RECORD_TYPE)[keyof typeof WATERING_RECORD_TYPE];

/** The shape needed to classify a watering record. */
export interface ClassifiableRecord {
  record_type?: string | null;
  notes?: string | null;
}

/**
 * Whether a `watering_records` row is a postponement rather than a real watering.
 *
 * `record_type` is authoritative. The legacy `POSTPONEMENT:` notes marker is still consulted as
 * a fallback, which covers rows written by a stale client that predates the column. Writes set
 * both, so the fallback should never be the deciding factor in practice.
 *
 * Always use this helper rather than an inline notes check: the substring convention was
 * duplicated across roughly eight call sites and one of them had already forgotten to apply it.
 */
export function isPostponementRecord(record: ClassifiableRecord): boolean {
  if (record.record_type) {
    return record.record_type === WATERING_RECORD_TYPE.postponement;
  }
  return Boolean(record.notes?.includes(POSTPONEMENT_PREFIX));
}

/**
 * Filters a list of watering records down to real waterings, excluding postponements.
 */
export function excludePostponements<T extends ClassifiableRecord>(records: T[]): T[] {
  return records.filter(record => !isPostponementRecord(record));
}

/**
 * Column list to select when records will be classified. Selecting `notes` alone is no longer
 * sufficient, since `record_type` is the authoritative discriminator.
 */
export const CLASSIFIABLE_RECORD_COLUMNS = 'record_type, notes';

/**
 * @deprecated Superseded by filtering on `record_type`. Retained only so the legacy marker
 * remains discoverable; do not use it for new queries.
 */
export const POSTPONEMENT_LIKE_PATTERN = `%${POSTPONEMENT_PREFIX}%`;
