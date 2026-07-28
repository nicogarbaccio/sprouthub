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
 * Whether a `watering_records` row is a postponement rather than a real watering.
 *
 * Postponements are stored as rows in `watering_records` with a `POSTPONEMENT:` marker in
 * their notes, dated in the future. Every query that derives watering intervals, streaks,
 * counts or averages MUST exclude them — a postponement is the user saying they did *not*
 * water.
 *
 * Always use this helper rather than an inline `notes.includes('POSTPONEMENT:')` check, so
 * there is one place to update when the marker moves to a real column.
 */
export function isPostponementRecord(record: {
  notes?: string | null;
}): boolean {
  return Boolean(record.notes?.includes(POSTPONEMENT_PREFIX));
}

/**
 * Filters a list of watering records down to real waterings, excluding postponements.
 */
export function excludePostponements<T extends { notes?: string | null }>(
  records: T[]
): T[] {
  return records.filter(record => !isPostponementRecord(record));
}

/**
 * SQL fragment matching postponement notes, for use with Supabase `.like()` / `.not()`.
 * Keeps the wildcard pattern in one place.
 */
export const POSTPONEMENT_LIKE_PATTERN = `%${POSTPONEMENT_PREFIX}%`;
