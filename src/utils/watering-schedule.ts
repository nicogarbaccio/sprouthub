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
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const postponedDateOnly = new Date(postponedDateTime.getFullYear(), postponedDateTime.getMonth(), postponedDateTime.getDate());
  
  // Calculate days between dates (ignoring time)
  const timeDiffPostponed = postponedDateOnly.getTime() - nowDateOnly.getTime();
  const daysUntilPostponedDate = Math.round(timeDiffPostponed / (1000 * 60 * 60 * 24));
  
  // If postponement date has arrived or passed, treat as normal plant
  if (daysUntilPostponedDate <= 0) {
   // Postponement date has arrived - revert to normal schedule
   // Calculate days since watering using calendar dates only
   const currentDate = new Date();
   const currentCalendarDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
   const latestWateringDate = new Date(plant.latest_watering);
   const wateredCalendarDate = new Date(latestWateringDate.getFullYear(), latestWateringDate.getMonth(), latestWateringDate.getDate());
   
   const timeDiff = currentCalendarDate.getTime() - wateredCalendarDate.getTime();
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

 // For normal (non-postponed) plants, calculate days since watering
 // Use simple calendar date calculation - no timezone considerations
 const currentDate = new Date();
 const currentCalendarDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

 const latestWateringDate = new Date(plant.latest_watering);
 const wateredCalendarDate = new Date(latestWateringDate.getFullYear(), latestWateringDate.getMonth(), latestWateringDate.getDate());

 const timeDiff = currentCalendarDate.getTime() - wateredCalendarDate.getTime();
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