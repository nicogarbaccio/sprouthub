/**
 * TypeScript interfaces for plant-related data structures
 */

/**
 * Watering record from database
 */
export interface WateringRecord {
  id: string;
  plant_id: string;
  watered_at: string;
  notes?: string | null;
  is_postponement?: boolean;
  created_at: string;
}

/**
 * Plant owner information
 */
export interface PlantOwner {
  email?: string;
  id: string;
}

/**
 * Household information
 */
export interface Household {
  id: string;
  name: string;
  description?: string | null;
}
