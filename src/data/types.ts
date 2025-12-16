/**
 * Catalog plant type representing plant species information
 * Used for the plant catalog and plant details pages
 */
export interface CatalogPlant {
  name: string;
  botanicalName: string;
  image: string;
  wateringFrequency: string;
  suggestedWateringDays: number;
  lightRequirement: string;
  careLevel: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description?: string;
  toxicity?: string;
  temperature?: string;
  humidity?: string;
  careInstructions?: string[];
  commonProblems?: string[];
  isOutdoorPlant?: boolean; // Added for weather-based rain delay feature
  otherNames?: string[];
}

/**
 * @deprecated Use CatalogPlant instead
 * Kept for backward compatibility during migration
 */
export type Plant = CatalogPlant;

/**
 * User plant type representing a user's plant instance
 * Re-exported from useUserPlants hook for centralized type access
 *
 * Use this type when working with user-owned plants (not catalog plants)
 */
export type { UserPlant } from '@/hooks/useUserPlants';
