/**
 * The database sequence for postponing a watering.
 *
 * Shared because `usePlantActions` and `useHouseholdPlants` both postpone, and they had drifted:
 * one took a day count and the other an absolute `Date`, and the household version skipped both
 * the already-postponed dedupe check and the `postponement_count` increment that pattern
 * analysis relies on to detect over-scheduled plants.
 *
 * Callers keep their own optimistic UI update and toast, since their plant state shapes differ.
 * Everything that touches the database lives here.
 */

import { supabase } from '@/integrations/supabase/client';
import { POSTPONEMENT_PREFIX, WATERING_RECORD_TYPE } from './notesPrefixes';

/** Hour of the target day a postponement lands on, for consistency across the app. */
const POSTPONEMENT_HOUR = 9;

const DEFAULT_POSTPONE_REASON = "Watering postponed - plant didn't need water yet";

export type PostponeOutcome =
    | {
        status: 'postponed';
        /** ISO timestamp the watering was deferred to. */
        postponementDate: string;
        /** Notes written to the record, including the legacy prefix. */
        notes: string;
        /** Days deferred, after normalisation. */
        days: number;
    }
    | { status: 'already_postponed' };

export interface PostponePlantWateringParams {
    plantId: string;
    userId: string;
    /** Days to defer. Defaults to 1. Rain delay suggests 1–3 based on forecast probability. */
    days?: number;
    /** Human-readable cause, recorded in the notes. */
    reason?: string;
    /**
     * The plant's current `postponement_count`, if the caller already has it. Passing it avoids a
     * read; omitting it means the count is fetched.
     */
    currentPostponementCount?: number | null;
}

/**
 * Builds the notes string for a postponement record.
 *
 * The `POSTPONEMENT:` prefix is still written alongside `record_type` because it is
 * human-readable in the watering history UI. `record_type` is what queries filter on.
 */
export function buildPostponementNotes(reason?: string): string {
    return `${POSTPONEMENT_PREFIX} ${reason || DEFAULT_POSTPONE_REASON}`;
}

/** The instant a postponement of `days` from now should land on. */
export function resolvePostponementDate(days: number, now: Date = new Date()): Date {
    const deferDays = Math.max(1, Math.round(days));
    const target = new Date(now);
    target.setDate(target.getDate() + deferDays);
    target.setHours(POSTPONEMENT_HOUR, 0, 0, 0);
    return target;
}

/**
 * Whether the plant already has a pending (future-dated) postponement.
 *
 * Postponing twice would stack deferrals the user never asked for, so this is checked first.
 */
async function hasPendingPostponement(plantId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('watering_records')
        .select('id')
        .eq('plant_id', plantId)
        .eq('record_type', WATERING_RECORD_TYPE.postponement)
        .gt('watered_at', new Date().toISOString())
        .limit(1);

    if (error) throw error;
    return Boolean(data && data.length > 0);
}

/**
 * Defers a plant's watering by `days`.
 *
 * Returns `already_postponed` without writing anything when a pending postponement exists.
 * Throws on database failure so callers can surface their own error handling.
 */
export async function postponePlantWatering({
    plantId,
    userId,
    days = 1,
    reason,
    currentPostponementCount,
}: PostponePlantWateringParams): Promise<PostponeOutcome> {
    if (await hasPendingPostponement(plantId)) {
        return { status: 'already_postponed' };
    }

    const target = resolvePostponementDate(days);
    const postponementDate = target.toISOString();
    const notes = buildPostponementNotes(reason);
    const deferDays = Math.max(1, Math.round(days));

    const { error: insertError } = await supabase.from('watering_records').insert({
        plant_id: plantId,
        watered_at: postponementDate,
        notes,
        record_type: WATERING_RECORD_TYPE.postponement,
        performed_by: userId,
    });

    if (insertError) throw insertError;

    await incrementPostponementCount(plantId, postponementDate, currentPostponementCount);

    return { status: 'postponed', postponementDate, notes, days: deferDays };
}

/**
 * Records that the user chose not to water.
 *
 * Each postponement is a "soil was still moist" signal that pattern analysis uses to detect an
 * over-aggressive schedule. Failure here is non-fatal: `watering_records` remains the source of
 * truth, so the count is a convenience rather than the record itself.
 */
async function incrementPostponementCount(
    plantId: string,
    postponementDate: string,
    knownCount?: number | null
): Promise<void> {
    let count = knownCount;

    if (count === undefined || count === null) {
        const { data } = await supabase
            .from('user_plants')
            .select('postponement_count')
            .eq('id', plantId)
            .maybeSingle();
        count = data?.postponement_count ?? 0;
    }

    await supabase
        .from('user_plants')
        .update({
            postponement_count: count + 1,
            last_postponement_date: postponementDate,
        })
        .eq('id', plantId);
}
