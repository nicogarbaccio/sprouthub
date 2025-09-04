/**
 * Utility functions for watering schedule calculations that properly handle postponed plants
 */

export interface PlantWateringInfo {
 latest_watering?: string | null;
 days_since_watering?: number | null;
 suggested_watering_days?: number | null;
}

export interface WateringCalculation {
 daysUntilWatering: number;
 isPostponed: boolean;
 isOverdue: boolean;
 hasUnknownWateringDate: boolean;
 effectiveLastWatering?: string;
}

/**
 * Calculates proper watering schedule for a plant, handling postponed plants correctly
 */
export function calculateWateringSchedule(plant: PlantWateringInfo): WateringCalculation {
 const wateringSchedule = plant.suggested_watering_days || 7;
 const now = new Date();
 
 // Check if plant has any watering data
 if (!plant.latest_watering) {
 return {
  daysUntilWatering: 999, // Large number = not due for a long time when no watering data
  isPostponed: false,
  isOverdue: false,
  hasUnknownWateringDate: true,
 };
 }

 const latestWateringDate = new Date(plant.latest_watering);
 const isPostponed = latestWateringDate > now;

 // If the plant is postponed (latest watering is in the future)
 if (isPostponed) {
 // Calculate days until the postponed date using calendar days
 const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 const postponedDate = new Date(latestWateringDate.getFullYear(), latestWateringDate.getMonth(), latestWateringDate.getDate());
 const timeDiff = postponedDate.getTime() - nowDate.getTime();
 const daysUntilPostponedDate = Math.round(timeDiff / (1000 * 60 * 60 * 24));
 
 return {
  daysUntilWatering: Math.max(0, daysUntilPostponedDate),
  isPostponed: true,
  isOverdue: false,
  hasUnknownWateringDate: false,
  effectiveLastWatering: plant.latest_watering,
 };
 }

 // For normal (non-postponed) plants, use the database-calculated days_since_watering
 if (plant.days_since_watering !== null && plant.days_since_watering !== undefined) {
 const daysUntilWatering = wateringSchedule - plant.days_since_watering;
 const isOverdue = daysUntilWatering < 0;
 
 return {
  daysUntilWatering,
  isPostponed: false,
  isOverdue,
  hasUnknownWateringDate: false,
  effectiveLastWatering: plant.latest_watering,
 };
 }

 // Fallback: calculate manually if days_since_watering is not available
 // Use calendar days instead of precise time differences for historical dates
 const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 const wateredDate = new Date(latestWateringDate.getFullYear(), latestWateringDate.getMonth(), latestWateringDate.getDate());
 const timeDiff = nowDate.getTime() - wateredDate.getTime();
 const daysSinceWatering = Math.round(timeDiff / (1000 * 60 * 60 * 24));
 const daysUntilWatering = wateringSchedule - daysSinceWatering;
 const isOverdue = daysUntilWatering < 0;

 return {
 daysUntilWatering,
 isPostponed: false,
 isOverdue,
 hasUnknownWateringDate: false,
 effectiveLastWatering: plant.latest_watering,
 };
}

/**
 * Legacy function for backward compatibility - calculates if a plant is overdue
 */
export function isPlantOverdue(
 daysAgo: number | undefined,
 wateringSchedule: number,
 hasLastWatered: boolean
): boolean {
 return hasLastWatered && daysAgo !== undefined && daysAgo > wateringSchedule;
}

/**
 * Calculates the next watering date string for display
 */
export function getNextWateringDate(
 lastWatered: string | undefined,
 daysAgo: number | undefined,
 wateringSchedule: number,
 formatDate: (dateString: string) => string
): string {
 if (!lastWatered || daysAgo === undefined) {
 return "Unknown";
 }

 const lastWateredDate = new Date(lastWatered);
 const now = new Date();
 
 // If lastWatered is in the future (postponed), return that date
 if (lastWateredDate > now) {
 return formatDate(lastWatered);
 }

 // Otherwise, calculate next watering based on schedule
 const nextWatering = new Date(lastWateredDate);
 nextWatering.setDate(nextWatering.getDate() + wateringSchedule);

 return formatDate(nextWatering.toISOString());
}
