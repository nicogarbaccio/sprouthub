/**
 * Canonical season detection.
 *
 * This module is the SINGLE source of truth for "what season is it?". Nothing else in the app
 * may derive a season from the month.
 *
 * Previously five places answered this question and three of them were northern-hemisphere
 * only (`smartSchedule.getCurrentSeason`, `createFallbackWeatherData`, and an inline
 * `month === 12 || 1 || 2` winter check in `scheduleUpdater`), which meant a southern
 * hemisphere user could be told it was summer by the watering wizard while the fertilization
 * gate correctly said winter.
 */

import type { Hemisphere } from './hemisphere';
import { resolveHemisphere, type HemisphereInput } from './hemisphere';

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export * from './hemisphere';

/** Month (0-indexed) and day a season begins in the northern hemisphere. */
interface SeasonBoundary {
    month: number;
    day: number;
}

/**
 * Astronomical season starts for the northern hemisphere. Dates drift by a day between years;
 * fixed dates are accurate enough for watering guidance.
 */
const NORTHERN_SEASON_STARTS: Record<Season, SeasonBoundary> = {
    spring: { month: 2, day: 20 }, // ~March 20
    summer: { month: 5, day: 21 }, // ~June 21
    fall: { month: 8, day: 22 },   // ~September 22
    winter: { month: 11, day: 21 }, // ~December 21
};

/** Season six months opposite, used to invert for the southern hemisphere. */
const OPPOSITE_SEASON: Record<Season, Season> = {
    spring: 'fall',
    summer: 'winter',
    fall: 'spring',
    winter: 'summer',
};

/** Seasons in calendar order, for boundary scanning. */
const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

/**
 * The season a date falls in, for a given hemisphere.
 *
 * @param date - the date to evaluate
 * @param hemisphere - resolved via `resolveHemisphere`; not optional on purpose, so callers
 *   cannot accidentally assume northern
 */
export function getSeason(date: Date, hemisphere: Hemisphere): Season {
    const month = date.getMonth();
    const day = date.getDate();

    let season: Season;

    if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21)) {
        season = 'spring';
    } else if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 22)) {
        season = 'summer';
    } else if ((month === 8 && day >= 22) || month === 9 || month === 10 || (month === 11 && day < 21)) {
        season = 'fall';
    } else {
        season = 'winter';
    }

    return hemisphere === 'southern' ? OPPOSITE_SEASON[season] : season;
}

/**
 * Resolves hemisphere and season together. Convenience for callers that hold raw
 * latitude/timezone rather than an already-resolved hemisphere.
 */
export function getSeasonForLocation(
    input: HemisphereInput & { date?: Date } = {}
): { season: Season; hemisphere: Hemisphere; isAssumedHemisphere: boolean } {
    const { date = new Date(), ...hemisphereInput } = input;
    const resolution = resolveHemisphere(hemisphereInput);

    return {
        season: getSeason(date, resolution.hemisphere),
        hemisphere: resolution.hemisphere,
        isAssumedHemisphere: resolution.isAssumed,
    };
}

/**
 * Whether a season is part of the active growing season.
 *
 * Growing season governs both fertilization eligibility and the direction of seasonal
 * watering adjustment, so it is defined here once.
 */
export function isGrowingSeason(season: Season): boolean {
    return season === 'spring' || season === 'summer';
}

/** Boundary dates for a hemisphere, inverted from the northern definitions if needed. */
function seasonStartsFor(hemisphere: Hemisphere): Record<Season, SeasonBoundary> {
    if (hemisphere === 'northern') return NORTHERN_SEASON_STARTS;

    // In the southern hemisphere, the date northern spring begins is when fall begins.
    return {
        spring: NORTHERN_SEASON_STARTS.fall,
        summer: NORTHERN_SEASON_STARTS.winter,
        fall: NORTHERN_SEASON_STARTS.spring,
        winter: NORTHERN_SEASON_STARTS.summer,
    };
}

/** The next season boundary at or after `fromDate`, and the season it begins. */
export function getNextSeasonChange(
    fromDate: Date,
    hemisphere: Hemisphere
): { date: Date; season: Season } {
    const starts = seasonStartsFor(hemisphere);
    const year = fromDate.getFullYear();

    // Boundaries are scanned in calendar order, which is why the southern mapping above swaps
    // the dates rather than the season labels.
    const candidates = SEASON_ORDER.map(season => ({
        season,
        date: new Date(year, starts[season].month, starts[season].day),
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const candidate of candidates) {
        if (candidate.date > fromDate) return candidate;
    }

    // Past every boundary this year — wrap to the earliest boundary next year.
    const earliest = candidates[0];
    return {
        season: earliest.season,
        date: new Date(year + 1, earliest.date.getMonth(), earliest.date.getDate()),
    };
}

/** Title-cased season name for display. */
export function formatSeasonName(season: Season): string {
    return season.charAt(0).toUpperCase() + season.slice(1);
}
