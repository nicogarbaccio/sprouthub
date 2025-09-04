import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
 calculateWateringSchedule,
 getNextWateringDate,
 isPlantOverdue,
 type PlantWateringInfo,
 type WateringCalculation,
} from '../watering-schedule';

// Test helper functions
const createMockPlant = (options: Partial<PlantWateringInfo> = {}): PlantWateringInfo => ({
 suggested_watering_days: 7,
 latest_watering: '2024-01-15T10:00:00Z',
 days_since_watering: 5,
 ...options,
});

const createPostponedPlant = (daysFromNow: number): PlantWateringInfo => {
 const futureDate = new Date();
 futureDate.setDate(futureDate.getDate() + daysFromNow);
 futureDate.setHours(9, 0, 0, 0);
 
 return {
 suggested_watering_days: 7,
 latest_watering: futureDate.toISOString(),
 days_since_watering: null, // Database would show null for future dates
 };
};

const createPostponedPlantAtTime = (daysFromNow: number, baseTime: Date): PlantWateringInfo => {
 const futureDate = new Date(baseTime);
 futureDate.setDate(futureDate.getDate() + daysFromNow);
 futureDate.setHours(9, 0, 0, 0);
 
 return {
 suggested_watering_days: 7,
 latest_watering: futureDate.toISOString(),
 days_since_watering: null, // Database would show null for future dates
 };
};

const createOverduePlant = (daysOverdue: number): PlantWateringInfo => {
 const pastDate = new Date();
 pastDate.setDate(pastDate.getDate() - (7 + daysOverdue)); // 7 day cycle + overdue days
 
 return {
 suggested_watering_days: 7,
 latest_watering: pastDate.toISOString(),
 days_since_watering: 7 + daysOverdue,
 };
};

const mockFormatDate = (dateString: string): string => {
 return new Date(dateString).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
};

describe('calculateWateringSchedule', () => {
 beforeEach(() => {
 // Reset any date mocks
 vi.useRealTimers();
 });

 describe('Normal watering scenarios', () => {
 test('should calculate correct days until watering for healthy plant', () => {
  const plant = createMockPlant({
  suggested_watering_days: 7,
  days_since_watering: 5,
  });

  const result = calculateWateringSchedule(plant);

  expect(result.daysUntilWatering).toBe(2); // 7 - 5 = 2 days left
  expect(result.isPostponed).toBe(false);
  expect(result.isOverdue).toBe(false);
  expect(result.hasUnknownWateringDate).toBe(false);
 });

 test('should identify overdue plants correctly', () => {
  const plant = createOverduePlant(3); // 3 days overdue

  const result = calculateWateringSchedule(plant);

  expect(result.daysUntilWatering).toBe(-3); // Negative = overdue
  expect(result.isOverdue).toBe(true);
  expect(result.isPostponed).toBe(false);
  expect(result.hasUnknownWateringDate).toBe(false);
 });

 test('should identify plants due today', () => {
  const plant = createMockPlant({
  suggested_watering_days: 7,
  days_since_watering: 7, // Exactly on schedule
  });

  const result = calculateWateringSchedule(plant);

  expect(result.daysUntilWatering).toBe(0);
  expect(result.isOverdue).toBe(false);
  expect(result.isPostponed).toBe(false);
  expect(result.hasUnknownWateringDate).toBe(false);
 });

 test('should handle plants with unknown watering data', () => {
  const plant = createMockPlant({
  latest_watering: null,
  days_since_watering: null,
  });

  const result = calculateWateringSchedule(plant);

  expect(result.daysUntilWatering).toBe(999); // Large number for unknown
  expect(result.isPostponed).toBe(false);
  expect(result.isOverdue).toBe(false);
  expect(result.hasUnknownWateringDate).toBe(true);
 });
 });

 describe('Postponed plant scenarios', () => {
 test('should identify postponed plants (future latest_watering)', () => {
  const plant = createPostponedPlant(1); // Postponed to tomorrow

  const result = calculateWateringSchedule(plant);

  expect(result.isPostponed).toBe(true);
  expect(result.isOverdue).toBe(false);
  expect(result.hasUnknownWateringDate).toBe(false);
  expect(result.daysUntilWatering).toBeGreaterThanOrEqual(0);
 });

 test('should calculate days until postponed date correctly', () => {
  const plant = createPostponedPlant(3); // Postponed to 3 days from now

  const result = calculateWateringSchedule(plant);

  expect(result.isPostponed).toBe(true);
  expect(result.daysUntilWatering).toBe(3);
 });

 test('should handle postponed plant due tomorrow', () => {
  const plant = createPostponedPlant(1);

  const result = calculateWateringSchedule(plant);

  expect(result.isPostponed).toBe(true);
  expect(result.daysUntilWatering).toBe(1);
 });

 test('should handle postponed plant due in multiple days', () => {
  const plant = createPostponedPlant(5);

  const result = calculateWateringSchedule(plant);

  expect(result.isPostponed).toBe(true);
  expect(result.daysUntilWatering).toBe(5);
 });
 });

 describe('Edge cases', () => {
 test('should handle null/undefined latest_watering', () => {
  const plant = createMockPlant({
  latest_watering: undefined,
  });

  const result = calculateWateringSchedule(plant);

  expect(result.hasUnknownWateringDate).toBe(true);
  expect(result.daysUntilWatering).toBe(999);
 });

 test('should handle null/undefined days_since_watering', () => {
  const plant = createMockPlant({
  days_since_watering: null,
  });

  const result = calculateWateringSchedule(plant);

  expect(result.hasUnknownWateringDate).toBe(false);
  // Should fall back to manual calculation
  expect(typeof result.daysUntilWatering).toBe('number');
 });

 test('should handle missing suggested_watering_days (default to 7)', () => {
  const plant = createMockPlant({
  suggested_watering_days: null,
  days_since_watering: 5,
  });

  const result = calculateWateringSchedule(plant);

  expect(result.daysUntilWatering).toBe(2); // 7 - 5 = 2 (using default 7)
 });

 test('should handle very large watering intervals', () => {
  const plant = createMockPlant({
  suggested_watering_days: 365, // Once a year
  days_since_watering: 300,
  });

  const result = calculateWateringSchedule(plant);

  expect(result.daysUntilWatering).toBe(65); // 365 - 300
  expect(result.isOverdue).toBe(false);
 });

 test('should handle negative days_since_watering (corrupted data)', () => {
  const plant = createMockPlant({
  days_since_watering: -5, // Corrupted data
  });

  const result = calculateWateringSchedule(plant);

  // Should handle gracefully
  expect(typeof result.daysUntilWatering).toBe('number');
  expect(result.hasUnknownWateringDate).toBe(false);
 });
 });
});

describe('getNextWateringDate', () => {
 describe('Normal scenarios', () => {
 test('should calculate next watering date from past watering', () => {
  const lastWatered = '2024-01-15T10:00:00Z';
  const daysAgo = 5;
  const wateringSchedule = 7;

  const result = getNextWateringDate(lastWatered, daysAgo, wateringSchedule, mockFormatDate);

  // Should be 7 days after lastWatered
  expect(result).toBe(mockFormatDate('2024-01-22T10:00:00Z'));
 });

 test('should return "Unknown" for missing data', () => {
  const result1 = getNextWateringDate(undefined, 5, 7, mockFormatDate);
  const result2 = getNextWateringDate('2024-01-15T10:00:00Z', undefined, 7, mockFormatDate);

  expect(result1).toBe('Unknown');
  expect(result2).toBe('Unknown');
 });
 });

 describe('Postponed scenarios', () => {
 test('should return postponed date when latest_watering is in future', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);
  const postponedDate = futureDate.toISOString();

  const result = getNextWateringDate(postponedDate, null, 7, mockFormatDate);

  expect(result).toBe(mockFormatDate(postponedDate));
 });

 test('should format postponed date correctly', () => {
  // Test with a future date that won't change based on current time
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // One year in the future
  const postponedDate = futureDate.toISOString();
  
  const result = getNextWateringDate(postponedDate, null, 7, mockFormatDate);

  expect(result).toBe(mockFormatDate(postponedDate));
 });
 });
});

describe('isPlantOverdue', () => {
 test('should identify overdue plants correctly', () => {
 expect(isPlantOverdue(10, 7, true)).toBe(true); // 10 days ago, 7 day schedule
 expect(isPlantOverdue(5, 7, true)).toBe(false); // 5 days ago, 7 day schedule
 expect(isPlantOverdue(7, 7, true)).toBe(false); // Exactly on time
 expect(isPlantOverdue(10, 7, false)).toBe(false); // No watering history
 });

 test('should handle edge cases', () => {
 expect(isPlantOverdue(undefined, 7, true)).toBe(false);
 expect(isPlantOverdue(10, 7, false)).toBe(false);
 });
});

describe('Push to Tomorrow Bug Prevention', () => {
 test('should NOT restart watering schedule when postponing', () => {
 // Scenario: Plant due today (day 21 of 21-day cycle)
 const plantDueToday = createMockPlant({
  suggested_watering_days: 21,
  days_since_watering: 21, // Due today
 });

 // Verify plant is due today
 const beforePostpone = calculateWateringSchedule(plantDueToday);
 expect(beforePostpone.daysUntilWatering).toBe(0);
 expect(beforePostpone.isOverdue).toBe(false);

 // After postponement (simulate future date)
 const postponedPlant = createMockPlant({
  suggested_watering_days: 21,
  latest_watering: (() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.toISOString();
  })(),
  days_since_watering: null, // Database would show null for future dates
 });

 const afterPostpone = calculateWateringSchedule(postponedPlant);

 // Critical assertions: Should show postponed, NOT restarted schedule
 expect(afterPostpone.isPostponed).toBe(true);
 expect(afterPostpone.daysUntilWatering).toBe(1); // 1 day until postponed date
 expect(afterPostpone.daysUntilWatering).not.toBe(21); // NOT restarted schedule!
 expect(afterPostpone.isOverdue).toBe(false);
 });

 test('should show correct status progression for postponed plant', () => {
 // Day 1: Plant due -> User postpones -> Shows "Postponed"
 vi.useFakeTimers();
 const mockCurrentDate = new Date('2024-01-15T10:00:00Z');
 vi.setSystemTime(mockCurrentDate);

 const postponedPlant = createPostponedPlantAtTime(1, mockCurrentDate);
 const postponedResult = calculateWateringSchedule(postponedPlant);

 expect(postponedResult.isPostponed).toBe(true);
 expect(postponedResult.daysUntilWatering).toBeGreaterThanOrEqual(0);
 expect(postponedResult.daysUntilWatering).toBeLessThanOrEqual(2);

 // Day 2: Should show closer to due (simulate the postponed date arriving)
 const nextDay = new Date('2024-01-16T10:00:00Z');
 vi.setSystemTime(nextDay);

 const nextDayResult = calculateWateringSchedule(postponedPlant);
 expect(nextDayResult.daysUntilWatering).toBeLessThanOrEqual(1);

 vi.useRealTimers();
 });
});

describe('Component Integration Scenarios', () => {
 describe('Dashboard statistics', () => {
 test('should count postponed plants in "due today" category', () => {
  const plants = [
  createOverduePlant(2),   // Overdue
  createMockPlant({ days_since_watering: 7 }), // Due today
  createPostponedPlant(1),   // Postponed
  createMockPlant({ days_since_watering: 3 }), // Healthy
  ];

  const stats = plants.reduce(
  (stats, plant) => {
   const calc = calculateWateringSchedule(plant);
   if (calc.isOverdue) {
   stats.overdue++;
   stats.needingWater++;
   } else if (calc.daysUntilWatering === 0 || calc.isPostponed) {
   stats.needingWater++;
   }
   return stats;
  },
  { overdue: 0, needingWater: 0 }
  );

  expect(stats.overdue).toBe(1);
  expect(stats.needingWater).toBe(3); // overdue + due today + postponed
 });

 test('should prioritize overdue > due today > postponed in task list', () => {
  const plants = [
  createPostponedPlant(1),   // Postponed (priority 3)
  createMockPlant({ days_since_watering: 7 }), // Due today (priority 2)
  createOverduePlant(2),   // Overdue (priority 1)
  ];

  const sortedPlants = plants.sort((a, b) => {
  const calcA = calculateWateringSchedule(a);
  const calcB = calculateWateringSchedule(b);

  // Sort by priority: overdue first (by how overdue), then due today, then postponed
  if (calcA.isOverdue && calcB.isOverdue) {
   return calcA.daysUntilWatering - calcB.daysUntilWatering; // More overdue first (more negative)
  }
  if (calcA.isOverdue && !calcB.isOverdue) return -1;
  if (!calcA.isOverdue && calcB.isOverdue) return 1;

  // Both not overdue, prioritize due today over postponed
  if (calcA.daysUntilWatering === 0 && calcB.isPostponed) return -1;
  if (calcA.isPostponed && calcB.daysUntilWatering === 0) return 1;

  return 0; // Equal priority
  });

  const results = sortedPlants.map(calculateWateringSchedule);

  expect(results[0].isOverdue).toBe(true);  // Overdue first
  expect(results[1].daysUntilWatering).toBe(0); // Due today second
  expect(results[2].isPostponed).toBe(true); // Postponed last
 });
 });

 describe('Plant card display scenarios', () => {
 test('should show "Postponed" status for future-dated plants', () => {
  vi.useFakeTimers();
  const mockCurrentDate = new Date('2024-01-15T10:00:00Z');
  vi.setSystemTime(mockCurrentDate);

  const postponedPlant = createPostponedPlantAtTime(2, mockCurrentDate);
  const result = calculateWateringSchedule(postponedPlant);

  expect(result.isPostponed).toBe(true);
  expect(result.daysUntilWatering).toBeGreaterThanOrEqual(1);
  expect(result.daysUntilWatering).toBeLessThanOrEqual(3);

  vi.useRealTimers();
 });

 test('should show correct days until postponed date', () => {
  vi.useFakeTimers();
  const mockCurrentDate = new Date('2024-01-15T10:00:00Z');
  vi.setSystemTime(mockCurrentDate);

  const postponedPlant = createPostponedPlantAtTime(5, mockCurrentDate);
  const result = calculateWateringSchedule(postponedPlant);

  expect(result.isPostponed).toBe(true);
  expect(result.daysUntilWatering).toBeGreaterThanOrEqual(4);
  expect(result.daysUntilWatering).toBeLessThanOrEqual(6);

  vi.useRealTimers();
 });

  test('should transition from "Postponed" to "Due today" correctly', () => {
  // Create a plant with watering date very close to current time
  vi.useFakeTimers();
  const mockCurrentDate = new Date('2024-01-15T10:00:00Z');
  vi.setSystemTime(mockCurrentDate);
  
  const plantPostponedToToday = createMockPlant({
   latest_watering: '2024-01-15T09:00:00Z', // 1 hour ago
   days_since_watering: 0, // Same day as today
  });

  const result = calculateWateringSchedule(plantPostponedToToday);

  // Since watering date is in the past (even if today), should calculate normally
  expect(result.daysUntilWatering).toBe(7); // Full schedule ahead
  expect(result.isPostponed).toBe(false); // Not postponed since it's in the past

  vi.useRealTimers();
 });

 test('should not show "Due today" for postponed plants even when daysUntilWatering is 0', () => {
  // Simulate the bug scenario: Sept 3rd, plant postponed to Sept 4th
  vi.useFakeTimers();
  const mockCurrentDate = new Date('2025-09-03T10:00:00Z'); // Today is Sept 3rd
  vi.setSystemTime(mockCurrentDate);
  
  const postponedPlant = createMockPlant({
   latest_watering: '2025-09-04T10:00:00Z', // Postponed to tomorrow (Sept 4th)
   suggested_watering_days: 7,
   days_since_watering: null, // Not applicable for postponed plants
  });

  const result = calculateWateringSchedule(postponedPlant);

  // Should correctly identify as postponed, not due today
  expect(result.isPostponed).toBe(true);
  expect(result.daysUntilWatering).toBe(1); // 1 day until postponed date
  expect(result.isOverdue).toBe(false);
  expect(result.hasUnknownWateringDate).toBe(false);

  vi.useRealTimers();
 });
 });
});

describe('Data integrity and error handling', () => {
 test('should handle malformed date strings gracefully', () => {
 const plantWithBadDate = createMockPlant({
  latest_watering: 'invalid-date-string',
 });

 expect(() => calculateWateringSchedule(plantWithBadDate)).not.toThrow();
 });

 test('should handle extreme scheduling values', () => {
 const plantWithExtremeSchedule = createMockPlant({
  suggested_watering_days: 1000,
  days_since_watering: 500,
 });

 const result = calculateWateringSchedule(plantWithExtremeSchedule);

 expect(result.daysUntilWatering).toBe(500);
 expect(result.isOverdue).toBe(false);
 });

 test('should maintain consistency between calculations', () => {
 const plant = createMockPlant();
 
 // Multiple calls should return identical results
 const result1 = calculateWateringSchedule(plant);
 const result2 = calculateWateringSchedule(plant);

 expect(result1).toEqual(result2);
 });
});
