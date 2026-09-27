/**
 * Canonical watering schedule calculation.
 *
 * This module is the SINGLE source of truth for answering "when is this plant due?".
 * Nothing else in the app may reimplement it — including the push-notification edge
 * function, which imports this file directly so that a push can never disagree with what
 * the user sees in the UI.
 *
 * ## Day boundary convention
 *
 * A "day" is a **calendar day in the viewer's timezone**. Watering timestamps are stored
 * as UTC instants (`timestamptz`), but due-ness is a human, calendar-oriented question: a
 * plant watered at 11pm Monday was watered "on Monday", even though that instant is
 * already Tuesday in UTC.
 *
 * In the browser the viewer's timezone is the runtime default, so `timeZone` can be
 * omitted. On the server (edge functions run in UTC) you MUST pass the user's stored
 * timezone, otherwise every user west of UTC gets their reminders a day early.
 *
 * Consequences you must respect:
 * - Never compare raw timestamps to decide due-ness. Use {@link getDaysSince}.
 * - Never use the `days_since_watering` column from `plants_with_watering_info`. It is
 *   computed as `now()::date - watered_at::date` in the *database* timezone, which drifts
 *   from what the user sees. It is deprecated; derive from `latest_watering` instead.
 */

/** Default interval used when a plant has no explicit schedule. */
export const DEFAULT_WATERING_DAYS = 7;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface PlantWateringInfo {
    latest_watering?: string | null;
    suggested_watering_days?: number | null;
    postponement_date?: string | null;
    postponement_notes?: string | null;
    last_postponement_date?: string | null;
    postponement_count?: number | null;
    /**
     * YYYY-MM-DD. While in the future, watering reminders are paused for a rest period (e.g.
     * a Lithops' dry winter) and the plant is next due on this date.
     */
    watering_paused_until?: string | null;
}

export interface WateringCalculation {
    /**
     * Whole days until the plant is due.
     * - `0` means due today, negative means overdue by that many days.
     * - `null` means "unknowable" (the plant has no watering history at all).
     *
     * `null` is deliberate: it forces callers to handle the unknown case instead of
     * silently sorting or comparing against a sentinel number.
     */
    daysUntilWatering: number | null;
    /** True when a postponement is still pending (its date has not yet arrived). */
    isPostponed: boolean;
    /** True when the plant is past due. Never true when the date is unknown. */
    isOverdue: boolean;
    /** True when the plant has never been watered, so no schedule can be derived. */
    hasUnknownWateringDate: boolean;
    /** True while watering reminders are paused for a rest period. */
    isResting: boolean;
    /** When a rest pause ends, if one is in effect. */
    restUntil?: Date;
    /** The date the plant is (or was) next due, accounting for postponement. */
    effectiveDueDate?: Date;
    /** The last real watering timestamp this calculation was based on. */
    effectiveLastWatering?: string;
}

export interface ScheduleOptions {
    /** Evaluation time. Defaults to now. Useful for tests. */
    now?: Date;
    /**
     * IANA timezone the calendar day should be resolved in, e.g. "America/New_York".
     * Omit to use the runtime default (correct in the browser, wrong on a server).
     */
    timeZone?: string;
}

/**
 * The number of whole days since the Unix epoch for the calendar day an instant falls on.
 * Comparing these integers gives exact calendar-day arithmetic with no DST drift.
 */
function calendarDayIndex(date: Date, timeZone?: string): number {
    let year: number;
    let month: number;
    let day: number;

    if (timeZone) {
        // en-CA formats as YYYY-MM-DD, which is trivially parseable.
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date);
        const [y, m, d] = parts.split('-').map(Number);
        year = y;
        month = m - 1;
        day = d;
    } else {
        year = date.getFullYear();
        month = date.getMonth();
        day = date.getDate();
    }

    return Math.round(Date.UTC(year, month, day) / MS_PER_DAY);
}

/**
 * Whole calendar days between two instants. Positive when `to` is later than `from`.
 */
export function getDaysBetweenCalendarDays(
    from: Date,
    to: Date,
    timeZone?: string
): number {
    return calendarDayIndex(to, timeZone) - calendarDayIndex(from, timeZone);
}

/**
 * Whole calendar days elapsed since an ISO timestamp.
 * Returns `null` for missing or unparseable input.
 *
 * Use this instead of the deprecated `days_since_watering` database column.
 */
export function getDaysSince(
    isoTimestamp: string | null | undefined,
    options: ScheduleOptions = {}
): number | null {
    if (!isoTimestamp) return null;
    const then = new Date(isoTimestamp);
    if (Number.isNaN(then.getTime())) return null;
    return getDaysBetweenCalendarDays(then, options.now ?? new Date(), options.timeZone);
}

/** Resolves a plant's watering interval, falling back to the default. */
export function getWateringIntervalDays(plant: PlantWateringInfo): number {
    const days = plant.suggested_watering_days;
    return typeof days === 'number' && days > 0 ? days : DEFAULT_WATERING_DAYS;
}

/**
 * Parses a YYYY-MM-DD date, as `watering_paused_until` is stored. Anchored at noon UTC so the
 * calendar day is the same in every timezone within ±12 hours.
 *
 * Lives here rather than in restPeriod.ts because the push-notification edge function imports
 * this file directly under Deno, so it must stay free of imports.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12));
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const UNKNOWN_SCHEDULE: WateringCalculation = {
    daysUntilWatering: null,
    isPostponed: false,
    isOverdue: false,
    hasUnknownWateringDate: true,
    isResting: false,
};

/**
 * Calculates when a plant is due for watering.
 *
 * Postponement semantics: a pending postponement *moves the due date*, it does not
 * replace the plant's state. Once the postponement date arrives the plant is due, and
 * once it passes the plant becomes overdue like any other. (Previously a lapsed
 * postponement pinned the plant to "Due today" forever, so it could never go overdue and
 * never triggered a notification.)
 */
export function calculateWateringSchedule(
    plant: PlantWateringInfo,
    options: ScheduleOptions = {}
): WateringCalculation {
    const now = options.now ?? new Date();
    const { timeZone } = options;
    const pauseEnd = parseDateOnly(plant.watering_paused_until);
    const daysUntilPauseEnds = pauseEnd ? getDaysBetweenCalendarDays(now, pauseEnd, timeZone) : null;

    // No watering history: nothing can be inferred. Callers must handle this explicitly.
    const lastWatered = plant.latest_watering ? new Date(plant.latest_watering) : null;
    if (!lastWatered || Number.isNaN(lastWatered.getTime())) {
        return daysUntilPauseEnds !== null && daysUntilPauseEnds > 0
            ? { ...UNKNOWN_SCHEDULE, isResting: true, restUntil: pauseEnd! }
            : UNKNOWN_SCHEDULE;
    }

    const intervalDays = getWateringIntervalDays(plant);

    // A postponement overrides the scheduled due date, whether or not it has lapsed.
    const postponedTo = plant.postponement_date ? new Date(plant.postponement_date) : null;
    const hasValidPostponement =
        postponedTo !== null && !Number.isNaN(postponedTo.getTime());

    let daysUntilWatering: number;
    let effectiveDueDate: Date;

    if (hasValidPostponement) {
        effectiveDueDate = postponedTo;
        daysUntilWatering = getDaysBetweenCalendarDays(now, postponedTo, timeZone);
    } else {
        // Derive from days elapsed rather than a constructed due-date instant, so the result
        // is stable across timezones and DST transitions.
        const daysSinceWatering = getDaysBetweenCalendarDays(lastWatered, now, timeZone);
        daysUntilWatering = intervalDays - daysSinceWatering;
        effectiveDueDate = addDays(lastWatered, intervalDays);
    }

    // A rest pause works like a postponement: it moves the due date to the day the rest ends.
    // Once that day passes the plant follows normal due/overdue rules, counted from the end of
    // the rest rather than from the last watering months ago. A pause that ended before the
    // last watering is stale and ignored.
    if (
        pauseEnd &&
        daysUntilPauseEnds !== null &&
        getDaysBetweenCalendarDays(lastWatered, pauseEnd, timeZone) > 0 &&
        daysUntilPauseEnds > daysUntilWatering
    ) {
        daysUntilWatering = daysUntilPauseEnds;
        effectiveDueDate = pauseEnd;
    }
    const isResting = pauseEnd !== null && daysUntilPauseEnds !== null && daysUntilPauseEnds > 0;

    return {
        daysUntilWatering,
        // Only a *future* postponement counts as postponed. Once it lapses the plant follows
        // normal due/overdue rules.
        isPostponed: hasValidPostponement && daysUntilWatering > 0,
        isOverdue: daysUntilWatering < 0,
        hasUnknownWateringDate: false,
        isResting,
        restUntil: isResting ? pauseEnd! : undefined,
        effectiveDueDate,
        effectiveLastWatering: plant.latest_watering,
    };
}

/**
 * The date a plant is next due, accounting for postponement.
 * Returns `null` when the plant has no watering history.
 */
export function getNextWateringDate(
    plant: PlantWateringInfo,
    options: ScheduleOptions = {}
): Date | null {
    return calculateWateringSchedule(plant, options).effectiveDueDate ?? null;
}

/**
 * Display helper: formats the next watering date, or "Unknown" when it can't be derived.
 */
export function formatNextWateringDate(
    plant: PlantWateringInfo,
    formatDate: (isoString: string) => string,
    options: ScheduleOptions = {}
): string {
    const next = getNextWateringDate(plant, options);
    return next ? formatDate(next.toISOString()) : 'Unknown';
}
