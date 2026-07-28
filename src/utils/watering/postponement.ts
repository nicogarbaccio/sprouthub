/**
 * Selecting the postponement that actually applies to a plant.
 *
 * Postponements are stored as future-dated rows in `watering_records`. A plant can
 * accumulate several over its life, so exactly one rule decides which (if any) still
 * governs the plant's due date. That rule lives here so every hook that enriches plant
 * data agrees.
 */

export interface PostponementLike {
    watered_at: string;
    notes?: string | null;
}

/**
 * Returns the postponement that currently applies to a plant, or `null`.
 *
 * A postponement only applies if it was made **after** the plant's most recent real
 * watering. Once the plant is watered, earlier postponements are historical: the user
 * has acted, so the deferral they requested is resolved.
 *
 * Records are expected to be sorted newest-first, matching the query in
 * `usePostponementData`.
 */
export function selectActivePostponement<T extends PostponementLike>(
    postponements: T[],
    lastWateredAt: string | null | undefined
): T | null {
    if (postponements.length === 0) return null;

    // With no watering history there is nothing for a postponement to be measured against,
    // and the plant's schedule is unknowable anyway.
    if (!lastWateredAt) return null;

    const lastWatering = new Date(lastWateredAt).getTime();
    if (Number.isNaN(lastWatering)) return null;

    return (
        postponements.find(p => new Date(p.watered_at).getTime() > lastWatering) ?? null
    );
}
