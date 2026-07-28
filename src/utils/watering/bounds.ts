/**
 * Watering interval bounds.
 *
 * These exist in one place because they previously did not. Four different clamps were in
 * play — 1–90, 2–45, 1–21, and a 14-day cap inside `adjustForPoorPerformance` — so whether a
 * suggestion survived depended on which code path produced it.
 *
 * Concretely: the catalog ships Lithops at 45 days. Under the old 2–45 clamp its winter
 * suggestion computed to 52 days and was clamped straight back to 45, meaning the app could
 * never advise reducing winter watering for the most overwatering-sensitive plant it knows
 * about.
 */

/**
 * Shortest interval that can be suggested.
 *
 * A 1-day interval is almost always a data error rather than a real schedule, so the floor is
 * 2. Plants that genuinely need daily water are outside what this app models.
 */
export const MIN_WATERING_DAYS = 2;

/**
 * Longest interval that can be suggested.
 *
 * Matches the ceiling `patternAnalyzer.calculateWateringIntervals` already uses, which was
 * raised to 90 precisely because a 45-day cap discarded valid intervals for cacti and ZZ
 * plants. Any lower value here would contradict pattern analysis.
 */
export const MAX_WATERING_DAYS = 90;

/**
 * Constrains an interval to the allowed range.
 *
 * Apply this ONCE, after all adjustments are combined. Clamping at intermediate steps loses
 * information: a plant clamped down mid-calculation cannot be adjusted back up by a later
 * factor, which silently biases the result.
 */
export function clampWateringInterval(days: number): number {
    return Math.max(MIN_WATERING_DAYS, Math.min(MAX_WATERING_DAYS, Math.round(days)));
}

/**
 * Whether an interval already sits outside the allowed range.
 *
 * Existing stored intervals are never rewritten — the clamp applies only to newly suggested
 * values — so callers displaying an out-of-range interval can use this to explain it.
 */
export function isOutsideWateringBounds(days: number): boolean {
    return days < MIN_WATERING_DAYS || days > MAX_WATERING_DAYS;
}
