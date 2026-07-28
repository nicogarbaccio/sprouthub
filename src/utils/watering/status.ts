/**
 * Canonical watering status presentation.
 *
 * SINGLE source of truth for the label and colour shown on a plant's watering badge.
 * Plant cards and the plant detail page previously had separate implementations with
 * different thresholds and wording, so the same plant could read "Watered today" on its
 * card and "Due today" on its detail page at the same moment.
 */

import type { WateringCalculation } from '@/utils/watering/schedule';
import { getDaysSince } from '@/utils/watering/schedule';

export type WateringStatusTone =
    | 'unknown'
    | 'postponed'
    | 'overdue'
    | 'due'
    | 'soon'
    | 'ok';

export interface WateringStatus {
    /** Human-readable label, e.g. "Overdue by 2 days". */
    text: string;
    /** Semantic tone, for callers that want to style it themselves. */
    tone: WateringStatusTone;
    /** Tailwind classes including background, text and border colour. */
    colorClasses: string;
}

/**
 * How recently a watering counts as "just watered", in hours. Within this window a plant
 * that is technically due today reads as "Watered today" so the user gets feedback that
 * their action registered.
 */
const JUST_WATERED_HOURS = 12;

const TONE_CLASSES: Record<WateringStatusTone, string> = {
    unknown: 'bg-neutral-500 text-white border-neutral-500',
    postponed: 'bg-sprout-water text-white border-sprout-water',
    overdue: 'bg-red-500 text-white border-red-500',
    due: 'bg-orange-500 text-white border-orange-500',
    soon: 'bg-orange-500 text-white border-orange-500',
    ok: 'bg-sprout-success text-white border-sprout-success',
};

function pluralizeDays(count: number): string {
    return count === 1 ? '1 day' : `${count} days`;
}

function hoursSince(isoTimestamp: string, now: Date): number {
    return (now.getTime() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);
}

/**
 * Derives the badge label and colour from a watering calculation.
 *
 * @param calc - result of `calculateWateringSchedule`
 * @param lastWateredDate - the plant's last watering timestamp, used for the
 *   "Watered today" affordance. Optional; omitting it just disables that affordance.
 */
export function getWateringStatus(
    calc: WateringCalculation,
    lastWateredDate?: string | null,
    now: Date = new Date()
): WateringStatus {
    const { daysUntilWatering, isOverdue, isPostponed, hasUnknownWateringDate } = calc;

    if (hasUnknownWateringDate || daysUntilWatering === null) {
        return { text: 'Unknown schedule', tone: 'unknown', colorClasses: TONE_CLASSES.unknown };
    }

    if (isPostponed) {
        const text =
            daysUntilWatering === 1
                ? 'Postponed until tomorrow'
                : `Postponed for ${pluralizeDays(daysUntilWatering)}`;
        return { text, tone: 'postponed', colorClasses: TONE_CLASSES.postponed };
    }

    if (isOverdue) {
        return {
            text: `Overdue by ${pluralizeDays(Math.abs(daysUntilWatering))}`,
            tone: 'overdue',
            colorClasses: TONE_CLASSES.overdue,
        };
    }

    if (daysUntilWatering === 0) {
        // Give immediate feedback right after watering a short-interval plant.
        if (lastWateredDate && hoursSince(lastWateredDate, now) <= JUST_WATERED_HOURS) {
            return { text: 'Watered today', tone: 'ok', colorClasses: TONE_CLASSES.ok };
        }
        return { text: 'Due today', tone: 'due', colorClasses: TONE_CLASSES.due };
    }

    if (daysUntilWatering === 1) {
        return { text: 'Water tomorrow', tone: 'soon', colorClasses: TONE_CLASSES.soon };
    }

    if (daysUntilWatering <= 2) {
        return {
            text: `Water in ${pluralizeDays(daysUntilWatering)}`,
            tone: 'soon',
            colorClasses: TONE_CLASSES.soon,
        };
    }

    return {
        text: `Water in ${pluralizeDays(daysUntilWatering)}`,
        tone: 'ok',
        colorClasses: TONE_CLASSES.ok,
    };
}

/**
 * Display helper for "last watered N days ago" style copy.
 * Returns `null` when there is no watering history.
 */
export function getDaysSinceWateringLabel(
    lastWateredDate: string | null | undefined,
    now: Date = new Date()
): string | null {
    const days = getDaysSince(lastWateredDate, { now });
    if (days === null) return null;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
}
