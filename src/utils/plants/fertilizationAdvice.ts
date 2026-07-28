/**
 * Fertilization advice parser and status utility
 *
 * Extracts structured fertilization guidance from plant care instructions and
 * computes whether a plant is currently due for fertilization based on season
 * and last fertilized date.
 */

import { getEnrichedPlantSync } from '@/data/enrichedPlants';
import { getDaysSince } from '@/utils/watering/schedule';
import {
  getSeason,
  isGrowingSeason,
  resolveHemisphere,
  resolveHemisphereFromEnvironment,
  type HemisphereInput,
} from '@/utils/season';

export interface FertilizationAdvice {
  /** Verbatim matched line from careInstructions, if one was found */
  rawTip: string | null;
  /** [min, max] frequency in weeks. null when no data is available. */
  frequencyWeeks: [number, number] | null;
  /** Human-readable frequency label, e.g. "monthly" or "every 6–8 weeks" */
  frequencyLabel: string;
  /** Fertilizer product type, e.g. "balanced fertilizer" or "succulent fertilizer" */
  fertilizerType: string | null;
  /** Where the advice came from */
  source: 'parsed' | 'category_fallback' | 'generic_fallback';
}

export interface FertilizationStatus {
  /** True when it is spring or summer (active growing season) */
  isGrowingSeason: boolean;
  /** Days since the last logged fertilization, or null if never logged */
  daysSinceLastFertilized: number | null;
  /**
   * True when the plant should be fertilized now: past its interval (or never fertilized)
   * AND in the growing season. Feeding during dormancy causes salt buildup, so this is
   * always false in fall and winter.
   */
  isDue: boolean;
  /**
   * True when the interval has elapsed, regardless of season. Use this to explain *why*
   * a dormant plant isn't being flagged ("ready, but wait for spring").
   */
  isIntervalElapsed: boolean;
  /**
   * Days until the interval elapses. Negative when already elapsed, null only when the
   * plant has never been fertilized. Available year-round, so the UI can say
   * "next feeding in N days" outside the growing season too.
   */
  daysUntilDue: number | null;
  /** The interval in days that this status was computed against. */
  intervalDays: number;
}

/**
 * Fallback interval when a plant's care instructions mention fertilizing but in a form we
 * can't parse a frequency from. Without this, such plants were never due — `isDue` stayed
 * false forever with no signal to the user.
 */
export const DEFAULT_FERTILIZATION_WEEKS = 4;

// ---------------------------------------------------------------------------
// Category-based fallbacks
// ---------------------------------------------------------------------------

interface CategoryFallback {
  frequencyWeeks: [number, number];
  frequencyLabel: string;
  fertilizerType: string;
}

const CATEGORY_FALLBACKS: Record<string, CategoryFallback> = {
  Succulents: { frequencyWeeks: [6, 8], frequencyLabel: 'every 6–8 weeks', fertilizerType: 'diluted succulent fertilizer' },
  'Air Plants': { frequencyWeeks: [4, 4], frequencyLabel: 'monthly', fertilizerType: 'bromeliad or air plant fertilizer (quarter-strength)' },
  'Flowering Plants': { frequencyWeeks: [2, 3], frequencyLabel: 'every 2–3 weeks', fertilizerType: 'balanced fertilizer' },
  'Tropical Plants': { frequencyWeeks: [4, 4], frequencyLabel: 'monthly', fertilizerType: 'balanced fertilizer' },
  'Low Maintenance': { frequencyWeeks: [8, 12], frequencyLabel: 'every 8–12 weeks', fertilizerType: 'balanced fertilizer' },
  Palms: { frequencyWeeks: [6, 8], frequencyLabel: 'every 6–8 weeks', fertilizerType: 'palm fertilizer' },
};

const GENERIC_FALLBACK: CategoryFallback = {
  frequencyWeeks: [4, 4],
  frequencyLabel: 'monthly',
  fertilizerType: 'balanced fertilizer',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise an en-dash or em-dash range separator to a hyphen */
function normaliseDash(s: string): string {
  return s.replace(/[–—]/g, '-');
}

/**
 * Try to extract a frequency in weeks from a fertilization instruction string.
 * Returns null if no recognisable pattern is found.
 */
function parseFrequencyWeeks(line: string): [number, number] | null {
  const s = normaliseDash(line.toLowerCase());

  // "every N-M months"
  const monthsRange = s.match(/every\s+(\d+)-(\d+)\s+months?/);
  if (monthsRange) {
    return [Math.round(Number(monthsRange[1]) * 4.33), Math.round(Number(monthsRange[2]) * 4.33)];
  }

  // "every N months"
  const months = s.match(/every\s+(\d+)\s+months?/);
  if (months) {
    const w = Math.round(Number(months[1]) * 4.33);
    return [w, w];
  }

  // "every N-M weeks"
  const weeksRange = s.match(/every\s+(\d+)-(\d+)\s+weeks?/);
  if (weeksRange) return [Number(weeksRange[1]), Number(weeksRange[2])];

  // "every N weeks"
  const weeks = s.match(/every\s+(\d+)\s+weeks?/);
  if (weeks) { const w = Number(weeks[1]); return [w, w]; }

  // "N-M times per year" — spread across 26-week growing season
  const timesPerYear = s.match(/(\d+)-(\d+)\s+times?\s+per\s+year/);
  if (timesPerYear) {
    const minW = Math.round(26 / Number(timesPerYear[2]));
    const maxW = Math.round(26 / Number(timesPerYear[1]));
    return [minW, maxW];
  }

  // "N times per year"
  const oncesPerYear = s.match(/(\d+)\s+times?\s+per\s+year/);
  if (oncesPerYear) {
    const w = Math.round(26 / Number(oncesPerYear[1]));
    return [w, w];
  }

  // "monthly" / "once a month"
  if (/monthly|once\s+a\s+month|once\s+per\s+month/.test(s)) return [4, 4];

  // "weekly"
  if (/weekly|once\s+a\s+week/.test(s)) return [1, 1];

  // "every 1-2 weeks"
  const oneTwo = s.match(/every\s+1-2\s+weeks?/);
  if (oneTwo) return [1, 2];

  return null;
}

/** Build a human-readable label from a [min, max] weeks pair */
function buildFrequencyLabel(freq: [number, number]): string {
  if (freq[0] === freq[1]) {
    if (freq[0] === 4) return 'monthly';
    if (freq[0] === 1) return 'weekly';
    return `every ${freq[0]} weeks`;
  }
  if (freq[0] === 2 && freq[1] === 3) return 'every 2–3 weeks';
  return `every ${freq[0]}–${freq[1]} weeks`;
}

/**
 * Strip the frequency portion and "fertilize/feed" verb from a line so what
 * remains is (hopefully) the fertilizer product type.
 */
function extractFertilizerType(line: string): string | null {
  let s = normaliseDash(line);

  // Remove common prefixes
  s = s.replace(/fertilize\s*(only\s*)?/i, '');
  s = s.replace(/feed\s*(only\s*)?/i, '');

  // Remove frequency patterns
  s = s.replace(/every\s+\d+(-\d+)?\s+(weeks?|months?)/i, '');
  s = s.replace(/\d+(-\d+)?\s+times?\s+per\s+year/i, '');
  s = s.replace(/monthly|weekly|once\s+a\s+(month|week)/i, '');

  // Remove season context
  s = s.replace(/during\s+(growing\s+season|spring\s+and\s+summer|active\s+growth|blooming|bloom\s+period)/i, '');
  s = s.replace(/in\s+(spring|summer|the\s+growing\s+season)/i, '');

  // Remove leading prepositions left over
  s = s.replace(/^[\s,;:with]+/i, '').replace(/[\s,;:.]+$/, '');

  // Capitalise product description if something useful remains
  if (s.length < 3) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse fertilization advice from a plant's careInstructions array.
 * Falls back to category-based defaults when no matching line is found.
 */
export function parseFertilizationFromCareInstructions(
  careInstructions: string[],
  category?: string
): FertilizationAdvice {
  // Scan for any fertilize/feed line
  const match = careInstructions.find(line =>
    /fertilize|fertiliser|feed(?!\s+your\s+pet)/i.test(line) &&
    // Exclude problem lines like "brown tips from over-fertilizing"
    !/over.?fertili|too\s+much\s+fertiliz|excess\s+fertiliz|salt.?build|avoid\s+fertiliz/i.test(line)
  );

  if (match) {
    const frequencyWeeks = parseFrequencyWeeks(match);
    const fertilizerType = extractFertilizerType(match);
    return {
      rawTip: match,
      frequencyWeeks,
      frequencyLabel: frequencyWeeks
        ? buildFrequencyLabel(frequencyWeeks)
        : 'during the growing season',
      fertilizerType,
      source: 'parsed',
    };
  }

  // Category fallback (case-insensitive key lookup)
  if (category) {
    const matchedKey = Object.keys(CATEGORY_FALLBACKS).find(
      k => k.toLowerCase() === category.toLowerCase()
    );
    const fallback = matchedKey ? CATEGORY_FALLBACKS[matchedKey] : undefined;
    if (fallback) {
      return {
        rawTip: null,
        frequencyWeeks: fallback.frequencyWeeks,
        frequencyLabel: fallback.frequencyLabel,
        fertilizerType: fallback.fertilizerType,
        source: 'category_fallback',
      };
    }
  }

  // Generic fallback
  return {
    rawTip: null,
    frequencyWeeks: GENERIC_FALLBACK.frequencyWeeks,
    frequencyLabel: GENERIC_FALLBACK.frequencyLabel,
    fertilizerType: GENERIC_FALLBACK.fertilizerType,
    source: 'generic_fallback',
  };
}

/**
 * Compute the current fertilization status for a plant.
 *
 * This is the SINGLE source of truth for "is this plant due for feeding?". The reminder
 * banner and the room cards previously used their own flat 60-day thresholds, so a plant
 * on a two-week schedule was due on its detail page at day 14 but invisible to the banner
 * until day 60, while a plant on a three-month schedule got flagged by the cards at day 61
 * even though its own advice said it wasn't due.
 *
 * Growing season is derived from the canonical season module, with hemisphere resolved via the
 * documented fallback chain (latitude, then timezone, then a flagged northern assumption).
 *
 * `isDue` is only ever true during the growing season — fertilizing during dormancy causes
 * salt buildup and root damage. Use `isIntervalElapsed` when you need the season-agnostic
 * answer.
 */
export function getFertilizationStatus(
  plant: { last_fertilized_at?: string | null },
  advice: FertilizationAdvice,
  currentDate: Date = new Date(),
  /**
   * Hemisphere input. Pass a latitude when location is granted; otherwise pass the user's
   * stored timezone. Omitting both resolves via the browser timezone rather than silently
   * assuming the northern hemisphere, which the previous `latitude = 40` default did.
   */
  hemisphereInput: HemisphereInput | number = {}
): FertilizationStatus {
  const resolution =
    typeof hemisphereInput === 'number'
      ? resolveHemisphere({ latitude: hemisphereInput })
      : resolveHemisphereFromEnvironment(hemisphereInput);

  const season = getSeason(currentDate, resolution.hemisphere);
  const growingSeason = isGrowingSeason(season);

  // Calendar-day based, matching the watering side of the app.
  const daysSinceLastFertilized = getDaysSince(plant.last_fertilized_at, {
    now: currentDate,
  });

  // Fall back to a sane interval rather than leaving the plant permanently "not due".
  const intervalDays =
    (advice.frequencyWeeks?.[1] ?? DEFAULT_FERTILIZATION_WEEKS) * 7;

  const isIntervalElapsed =
    daysSinceLastFertilized === null || daysSinceLastFertilized >= intervalDays;

  return {
    isGrowingSeason: growingSeason,
    daysSinceLastFertilized,
    isDue: growingSeason && isIntervalElapsed,
    isIntervalElapsed,
    // Computed year-round now, so dormant-season UI can still count down.
    daysUntilDue:
      daysSinceLastFertilized === null
        ? null
        : intervalDays - daysSinceLastFertilized,
    intervalDays,
  };
}

/**
 * Resolves fertilization advice and status for a plant in one step, matching it against the
 * plant catalog for care instructions.
 *
 * Prefer this over calling `parseFertilizationFromCareInstructions` and
 * `getFertilizationStatus` separately — it is what keeps every surface consistent.
 */
export function getPlantFertilizationStatus(
  plant: { plant_type: string; last_fertilized_at?: string | null },
  currentDate: Date = new Date(),
  /** See `getFertilizationStatus` — accepts a latitude, a timezone, or nothing. */
  hemisphereInput: HemisphereInput | number = {}
): { advice: FertilizationAdvice; status: FertilizationStatus } {
  const catalogEntry = getEnrichedPlantSync(plant.plant_type);
  const advice = parseFertilizationFromCareInstructions(
    catalogEntry?.careInstructions ?? [],
    catalogEntry?.category
  );

  return {
    advice,
    status: getFertilizationStatus(plant, advice, currentDate, hemisphereInput),
  };
}
