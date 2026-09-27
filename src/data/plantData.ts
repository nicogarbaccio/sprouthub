import { Plant } from './types';
import { catalogJson } from './catalog';
import type { CatalogEntry } from './catalog/schema';
import { PLANT_IMAGES_BASE_URL } from '@/constants/supabase';
import {
 getUniqueCategories as getUniqueCategoriesUtil,
 getUniqueCareLevels as getUniqueCareLevelsUtil,
 getUniqueLightRequirements as getUniqueLightRequirementsUtil
} from './utils';

// Re-export the Plant interface for backward compatibility
export type { Plant };

// Entries are validated against catalogEntrySchema in catalog.test.ts rather than at runtime.
export const plants: Plant[] = (catalogJson as CatalogEntry[]).map(
 ({ imagePath, ...entry }) => ({ ...entry, image: `${PLANT_IMAGES_BASE_URL}/${imagePath}` })
);

/** Look up a catalog plant by exact common or botanical name (case-insensitive). */
export const getCatalogPlant = (nameOrBotanical: string | undefined): Plant | undefined => {
 if (!nameOrBotanical) return undefined;
 const search = nameOrBotanical.toLowerCase();
 return plants.find(
  (p) => p.name.toLowerCase() === search || p.botanicalName.toLowerCase() === search
 );
};

// Re-export utility functions with plants array applied
export const getUniqueCategories = () => getUniqueCategoriesUtil(plants);
export const getUniqueCareLevels = () => getUniqueCareLevelsUtil(plants);
export const getUniqueLightRequirements = () => getUniqueLightRequirementsUtil(plants);
