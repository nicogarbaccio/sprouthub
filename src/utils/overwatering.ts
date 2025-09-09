export interface OverwateringRisk {
 level: 'none' | 'low' | 'high';
 count: number;
 windowDays: number;
 avgIntervalDays?: number;
}

export interface WateringRecordLike {
 watered_at: string;
 notes?: string | null;
}

export function computeOverwateringRisk(params: {
 records: WateringRecordLike[];
 suggestedDays?: number | null;
 now?: Date;
}): OverwateringRisk {
 const now = params.now ?? new Date();
 const suggestedDaysRaw = typeof params.suggestedDays === 'number' && !Number.isNaN(params.suggestedDays)
 ? params.suggestedDays
 : 7;
 const windowDays = Math.min(Math.max(suggestedDaysRaw, 2), 30);
 const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

 const recentDates = params.records
 .filter((record) => !record.notes || !record.notes.includes('POSTPONEMENT:'))
 .map((record) => new Date(record.watered_at))
 .filter((date) => date <= now && date >= windowStart)
 .sort((a, b) => a.getTime() - b.getTime());

 const count = recentDates.length;

 let avgIntervalDays: number | undefined;
 if (recentDates.length > 1) {
 const intervals: number[] = [];
 for (let i = 1; i < recentDates.length; i += 1) {
  const ms = recentDates[i].getTime() - recentDates[i - 1].getTime();
  intervals.push(ms / (1000 * 60 * 60 * 24));
 }
 const lastIntervals = intervals.slice(-5);
 const average = lastIntervals.reduce((sum, d) => sum + d, 0) / lastIntervals.length;
 avgIntervalDays = Math.round(average);
 }

 let level: OverwateringRisk['level'] = 'none';
 if (count >= 3) level = 'high';
 else if (count >= 2) level = 'low';

 if (avgIntervalDays !== undefined && avgIntervalDays < suggestedDaysRaw * 0.5) {
 level = level === 'none' ? 'low' : 'high';
 }

 return { level, count, windowDays, avgIntervalDays };
}

/**
 * Determines if a plant was recently watered and should show overwatering warning
 * @param lastWatered - The last watered date string
 * @param suggestedWateringDays - The plant's suggested watering schedule
 * @returns Object with warning flag and days since last watered
 */
export function shouldShowOverwateringWarning(
 lastWatered: string | null | undefined,
 suggestedWateringDays: number = 7
): { showWarning: boolean; daysSinceLastWatered?: number } {
 if (!lastWatered) {
 return { showWarning: false };
 }

 const lastWateredDate = new Date(lastWatered);
 const now = new Date();
 
 // Skip if the last watered date is in the future (postponed)
 if (lastWateredDate > now) {
 return { showWarning: false };
 }

 // Use calendar date arithmetic to match database view calculation
 // This ensures consistency between UI display and warning logic
 const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 const wateredDate = new Date(lastWateredDate.getFullYear(), lastWateredDate.getMonth(), lastWateredDate.getDate());
 const timeDiff = nowDate.getTime() - wateredDate.getTime();
 const daysSinceLastWatered = Math.round(timeDiff / (1000 * 60 * 60 * 24));

 // Show warning if watered within the last 2 days OR if watering too frequently
 // compared to the suggested schedule (less than 50% of suggested days)
 const tooRecent = daysSinceLastWatered <= 2;
 const tooFrequent = daysSinceLastWatered < (suggestedWateringDays * 0.5);
 
 return {
 showWarning: tooRecent || tooFrequent,
 daysSinceLastWatered,
 };
}


