import { describe, it, expect } from 'vitest';
import { shouldShowOverwateringWarning } from '../overwatering';

describe('shouldShowOverwateringWarning', () => {
 it('should show warning for plants watered today', () => {
 const today = new Date().toISOString();
 const result = shouldShowOverwateringWarning(today, 7);
 
 expect(result.showWarning).toBe(true);
 expect(result.daysSinceLastWatered).toBe(0);
 });

 it('should show warning for plants watered yesterday', () => {
 const yesterday = new Date();
 yesterday.setDate(yesterday.getDate() - 1);
 const result = shouldShowOverwateringWarning(yesterday.toISOString(), 7);
 
 expect(result.showWarning).toBe(true);
 expect(result.daysSinceLastWatered).toBe(1);
 });

 it('should show warning for plants watered 2 days ago', () => {
 const twoDaysAgo = new Date();
 twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
 const result = shouldShowOverwateringWarning(twoDaysAgo.toISOString(), 7);
 
 expect(result.showWarning).toBe(true);
 expect(result.daysSinceLastWatered).toBe(2);
 });

 it('should show warning for plants watered too frequently (less than 50% of suggested schedule)', () => {
 const threeDaysAgo = new Date();
 threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
 const result = shouldShowOverwateringWarning(threeDaysAgo.toISOString(), 7);
 
 expect(result.showWarning).toBe(true);
 expect(result.daysSinceLastWatered).toBe(3);
 });

 it('should not show warning for plants watered appropriately', () => {
 const fiveDaysAgo = new Date();
 fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
 const result = shouldShowOverwateringWarning(fiveDaysAgo.toISOString(), 7);
 
 expect(result.showWarning).toBe(false);
 expect(result.daysSinceLastWatered).toBe(5);
 });

 it('should not show warning for plants with no watering history', () => {
 const result = shouldShowOverwateringWarning(null, 7);
 
 expect(result.showWarning).toBe(false);
 expect(result.daysSinceLastWatered).toBeUndefined();
 });

 it('should not show warning for postponed plants (future date)', () => {
 const tomorrow = new Date();
 tomorrow.setDate(tomorrow.getDate() + 1);
 const result = shouldShowOverwateringWarning(tomorrow.toISOString(), 7);
 
 expect(result.showWarning).toBe(false);
 expect(result.daysSinceLastWatered).toBeUndefined();
 });

 it('should use default watering schedule of 7 days when not provided', () => {
 const twoDaysAgo = new Date();
 twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
 const result = shouldShowOverwateringWarning(twoDaysAgo.toISOString());
 
 expect(result.showWarning).toBe(true);
 expect(result.daysSinceLastWatered).toBe(2);
 });

 it('should handle different watering schedules correctly', () => {
 const twoDaysAgo = new Date();
 twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
 
 // For a 3-day schedule, 2 days ago should trigger warning (more than 50%)
 const result3Day = shouldShowOverwateringWarning(twoDaysAgo.toISOString(), 3);
 expect(result3Day.showWarning).toBe(true);
 
 // For a 14-day schedule, 2 days ago should trigger warning (recent watering)
 const result14Day = shouldShowOverwateringWarning(twoDaysAgo.toISOString(), 14);
 expect(result14Day.showWarning).toBe(true);
 });
});
