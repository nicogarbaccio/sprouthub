import summaryJson from 'virtual:catalog-summary';
import type { CatalogEntry } from './catalog/schema';
import type { CatalogPlant } from './types';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';

/**
 * The plant catalog without its long-form fields, for code on the first screens (dashboard,
 * add plant, landing page). Same plants, same order as `plants` in ./plantData, which the
 * detail and catalog pages use for the full text. See vite/catalogSummaryPlugin.ts.
 */

/** Left out of summaries. Keep in sync with HEAVY_CATALOG_FIELDS in vite/catalogSummaryPlugin.ts. */
export type HeavyCatalogField =
  | 'description'
  | 'careInstructions'
  | 'commonProblems'
  | 'toxicityDetail'
  | 'whatsNormal'
  | 'propagation'
  | 'taxonomy'
  | 'sources'
  | 'review';

export type PlantSummary = Omit<CatalogPlant, HeavyCatalogField>;

export const plantSummaries: PlantSummary[] = (summaryJson as Omit<CatalogEntry, HeavyCatalogField>[]).map(
  ({ imagePath, ...entry }) => ({ ...entry, image: `${PLANT_IMAGES_BASE_URL}/${imagePath}` })
);

/** Look up a catalog plant by exact common or botanical name (case-insensitive). */
export const getPlantSummary = (nameOrBotanical: string | undefined): PlantSummary | undefined => {
  if (!nameOrBotanical) return undefined;
  const search = nameOrBotanical.toLowerCase();
  return plantSummaries.find(
    (p) => p.name.toLowerCase() === search || p.botanicalName.toLowerCase() === search
  );
};
