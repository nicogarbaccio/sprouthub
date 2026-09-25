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
    /**
     * Bento redesign pill classes: terracotta when overdue, water blue when due, green right
     * after watering, and the plain card surface otherwise.
     */
    bentoClasses: string;
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

const BENTO_TONE_CLASSES: Record<WateringStatusTone, string> = {
    unknown: 'bg-sprout-cream text-sprout-dark',
    postponed: 'bg-card text-foreground',
    overdue: 'bg-sprout-warning text-sprout-dark',
    due: 'bg-sprout-water text-sprout-dark',
    soon: 'bg-card text-foreground',
    ok: 'bg-card text-foreground',
};

const JUST_WATERED_BENTO_CLASSES = 'bg-sprout-success text-sprout-dark';

function status(text: string, tone: WateringStatusTone, bentoClasses = BENTO_TONE_CLASSES[tone]): WateringStatus {
    return { text, tone, colorClasses: TONE_CLASSES[tone], bentoClasses };
}

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
        return status('Unknown schedule', 'unknown');
    }

    if (isPostponed) {
        const text =
            daysUntilWatering === 1
                ? 'Postponed until tomorrow'
                : `Postponed for ${pluralizeDays(daysUntilWatering)}`;
        return status(text, 'postponed');
    }

    if (isOverdue) {
        return status(`Overdue by ${pluralizeDays(Math.abs(daysUntilWatering))}`, 'overdue');
    }

    if (daysUntilWatering === 0) {
        // Give immediate feedback right after watering a short-interval plant.
        if (lastWateredDate && hoursSince(lastWateredDate, now) <= JUST_WATERED_HOURS) {
            return status('Watered today', 'ok', JUST_WATERED_BENTO_CLASSES);
        }
        return status('Due today', 'due');
    }

    if (daysUntilWatering === 1) {
        return status('Water tomorrow', 'soon');
    }

    if (daysUntilWatering <= 2) {
        return status(`Water in ${pluralizeDays(daysUntilWatering)}`, 'soon');
    }

    return status(`Water in ${pluralizeDays(daysUntilWatering)}`, 'ok');
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
