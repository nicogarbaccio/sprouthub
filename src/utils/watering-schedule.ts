/**
 * Utility functions for watering schedule calculations that properly handle postponed plants
 */

export interface PlantWateringInfo {
 latest_watering?: string | null;
 days_since_watering?: number | null;
 suggested_watering_days?: number | null;
 postponement_date?: string | null;
 postponement_notes?: string | null;
 last_postponement_date?: string | null;
 postponement_count?: number | null;
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

 // Check if the plant has a postponement
 if (plant.postponement_date) {
 const postponedDateTime = new Date(plant.postponement_date);
 const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 const postponedDateOnly = new Date(postponedDateTime.getFullYear(), postponedDateTime.getMonth(), postponedDateTime.getDate());
 
 // Calculate days between dates (ignoring time)
 const timeDiff = postponedDateOnly.getTime() - nowDate.getTime();
 const daysUntilPostponedDate = Math.round(timeDiff / (1000 * 60 * 60 * 24));
 
 // If postponement date has arrived or passed, treat as normal plant
 if (daysUntilPostponedDate <= 0) {
  // Postponement date has arrived - revert to normal schedule
  // Use the database-calculated days_since_watering for normal flow
  if (plant.days_since_watering !== null && plant.days_since_watering !== undefined) {
   const wateringSchedule = plant.suggested_watering_days || 7;
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
 } else {
  // Postponement is in the future (tomorrow or later)
  return {
  daysUntilWatering: daysUntilPostponedDate,
  isPostponed: true,
  isOverdue: false,
  hasUnknownWateringDate: false,
  effectiveLastWatering: plant.latest_watering,
  };
 }
 }

 // For normal (non-postponed) plants, use the database-calculated days_since_watering
 if (plant.days_since_watering !== null && plant.days_since_watering !== undefined) {
 let daysUntilWatering = wateringSchedule - plant.days_since_watering;
 let isOverdue = daysUntilWatering < 0;
 
 // Apply postponement grace period if plant was recently postponed
 if (plant.last_postponement_date && plant.postponement_count && plant.postponement_count > 0) {
  const lastPostponementDate = new Date(plant.last_postponement_date);
  const now = new Date();
  const daysSincePostponement = Math.floor((now.getTime() - lastPostponementDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // If postponed within the last 3 days, give extra grace period
  // This prevents plants from immediately showing as "due" after postponement deletion
  if (daysSincePostponement <= 3) {
   const gracePeriod = Math.min(plant.postponement_count, 3); // 1-3 extra days based on postponement frequency
   daysUntilWatering += gracePeriod;
   isOverdue = daysUntilWatering < 0;
  }
 }
 
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
 const latestWateringDate = new Date(plant.latest_watering);
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
 formatDate: (dateString: string) => string,
 postponementDate?: string | null
): string {
 if (!lastWatered || daysAgo === undefined) {
 return "Unknown";
 }

 // If plant has a postponement date, use that as the next watering date
 if (postponementDate) {
 return formatDate(postponementDate);
 }

 const lastWateredDate = new Date(lastWatered);
 const now = new Date();
 
 // Legacy check: If lastWatered is in the future (should not happen with postponementDate param)
 if (lastWateredDate > now) {
 return formatDate(lastWatered);
 }

 // Otherwise, calculate next watering based on schedule
 const nextWatering = new Date(lastWateredDate);
 nextWatering.setDate(nextWatering.getDate() + wateringSchedule);

 return formatDate(nextWatering.toISOString());
}
