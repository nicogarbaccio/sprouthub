/**
 * Plain-language wording for the catalog's structured care values, shown on plant pages.
 */

import type { LightLevel, PetRating, PlantCare, CatalogEntry } from '@/data/catalog/schema';

type Watering = NonNullable<PlantCare['watering']>;
type Light = NonNullable<PlantCare['light']>;
type PropagationMethod = NonNullable<CatalogEntry['propagation']>['methods'][number];

const DRYNESS: Record<Watering['dryness'], string> = {
  keep_moist: 'Keep the soil evenly moist — don\'t let it dry out',
  top_quarter: 'Water when the top quarter of the soil is dry',
  top_half: 'Water when the top half of the soil is dry',
  fully_dry: 'Let the soil dry out completely between waterings',
};

const OVERWATER: Record<Watering['overwaterSensitivity'], string> = {
  low: 'Low — handles extra water well',
  medium: 'Medium — let excess water drain away',
  high: 'High — rots easily, so err on the dry side',
};

const LIGHT: Record<LightLevel, string> = {
  low: 'low light',
  medium: 'medium light',
  bright_indirect: 'bright indirect light',
  direct: 'direct sun',
};
const LIGHT_ORDER: LightLevel[] = ['low', 'medium', 'bright_indirect', 'direct'];

const DIRECT_SUN: Record<Light['directSun'], string> = {
  avoid: 'Keep out of direct sun',
  morning: 'Gentle morning sun is fine; avoid harsh afternoon sun',
  full: 'Handles full sun',
};

const GROWTH: Record<NonNullable<PlantCare['growthRate']>, string> = {
  slow: 'Slow grower',
  moderate: 'Moderate grower',
  fast: 'Fast grower',
};

const PROPAGATION: Record<PropagationMethod, string> = {
  stem_cutting: 'Stem cuttings',
  leaf_cutting: 'Leaf cuttings',
  division: 'Division',
  offsets: 'Offsets (pups)',
  air_layering: 'Air layering',
  seed: 'Seed',
};

const PET_RATING: Record<PetRating, string> = {
  toxic: 'Toxic',
  non_toxic: 'Non-toxic',
  unknown: 'Unknown',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const drynessText = (dryness: Watering['dryness']) => DRYNESS[dryness];
export const overwaterText = (sensitivity: Watering['overwaterSensitivity']) => OVERWATER[sensitivity];
export const directSunText = (directSun: Light['directSun']) => DIRECT_SUN[directSun];
export const growthRateText = (rate: NonNullable<PlantCare['growthRate']>) => GROWTH[rate];
export const propagationMethodText = (method: PropagationMethod) => PROPAGATION[method];
export const petRatingText = (rating: PetRating) => PET_RATING[rating];

/** "About every 14 days" — winter intervals are often our own estimate, so they stay approximate */
export const winterWateringText = (days: number) => `About every ${days} days`;

/** "Rests in winter and summer" for species with no-water rest periods */
export function restPeriodsText(restPeriods: NonNullable<Watering['restPeriods']>): string {
  const seasons = restPeriods.map((p) => p.season);
  const list = seasons.length === 1 ? seasons[0] : `${seasons.slice(0, -1).join(', ')} and ${seasons[seasons.length - 1]}`;
  return `Rests in ${list} — little or no water then`;
}

export const idealLightText = (light: Light) => capitalize(LIGHT[light.ideal]);

/** The range of light a plant copes with, e.g. "Low light to bright indirect light" */
export function toleratedLightText(light: Light): string | null {
  const levels = LIGHT_ORDER.filter((l) => light.tolerates.includes(l));
  if (levels.length < 2) return null;
  const [lo, hi] = [levels[0], levels[levels.length - 1]];
  return `${capitalize(LIGHT[lo])} to ${LIGHT[hi]}`;
}

/** "Every 2-3 years" / "Every year" */
export function repotIntervalText([min, max]: [number, number]): string {
  if (max === 1) return 'Every year';
  if (min === max) return `Every ${min} years`;
  return `Every ${min}-${max} years`;
}
