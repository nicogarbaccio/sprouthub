# Calendar Date Watering Schedule Tests

## Overview

This test suite verifies the calendar date-based watering schedule calculations. We've simplified the approach to use calendar dates only, removing timezone-based complexity that was causing confusion and incorrect watering schedules.

## Problem Background

### Previous Timezone Issues
- **User expectation**: Plant watered "September 8th evening" → due September 15th → "Water in 5 days" on September 10th
- **Actual behavior**: Plant recorded as watered September 9th 00:14 UTC → due September 16th → "Water in 6 days"
- **Root cause**: Timezone conversion causing late evening waterings to be recorded as next day UTC

### Solution: Calendar Date Approach
1. **Simplified logic**: Use calendar dates only, no timezone considerations
2. **Consistent behavior**: Plants watered on a date are always counted from that calendar date
3. **User-friendly**: No confusion about timezones or early morning adjustments

## Test Coverage

### 1. Calendar Date Watering Schedule (`calendar-date-schedule.spec.ts`)

#### Test: "should calculate watering schedule using calendar dates only"
- **Simulates**: Plant watered at `2025-09-08T14:30:00.000Z` (September 8th at 2:30 PM UTC)
- **Database**: `days_since_watering: 2` (Sep 8 → Sep 10 = 2 days)
- **Expected**: Simple calendar date calculation
- **Result**: Shows "Water in 5 days" (7 - 2 = 5) and displays "Sep 8, 2025"

#### Test: "should handle plants due tomorrow correctly"
- **Simulates**: Plant watered at `2025-08-28T15:00:00.000Z` (August 28th)
- **Database**: `days_since_watering: 13` (Aug 28 → Sep 10 = 13 days)
- **Expected**: Plant due tomorrow (14 - 13 = 1 day)
- **Result**: Shows "Water tomorrow" and displays "Aug 28, 2025"

### 2. Existing Watering Schedule Tests

#### Updated Tests: `watering-schedule-calculation.spec.ts`
- **Updated**: All existing tests now use calendar date logic
- **Verified**: Normal plants, postponed plants, and overdue plants all calculate correctly
- **Confirmed**: No timezone-based adjustments are applied

## Key Benefits of Calendar Date Approach

- **Simplified logic**: No timezone conversions or early morning adjustments
- **Predictable behavior**: Plants watered on a date are always counted from that calendar date
- **User-friendly**: No confusion about timezones or complex date calculations
- **Maintainable**: Easier to understand and debug watering schedule issues

## Key Assertions

### Date Display Consistency
```typescript
// Verify calendar date shows correct date
const lastWateredText = calendarTestCard.locator('text=/sep.*8.*2025/i');
await expect(lastWateredText).toBeVisible();
```

### Calculation Accuracy  
```typescript
// Verify correct days calculation using calendar dates
const wateringStatus = calendarTestCard.locator('text=/water.*in.*5.*days?/i');
await expect(wateringStatus).toBeVisible();
```

### Tomorrow Plant Status
```typescript
// Verify plant due tomorrow shows correct status
const tomorrowStatus = tomorrowPlantCard.locator('text=/water.*tomorrow/i');
await expect(tomorrowStatus).toBeVisible();
```

## Running the Tests

### Individual Test Files
```bash
# Run calendar date schedule tests
npx playwright test tests/e2e/watering/calendar-date-schedule.spec.ts

# Run updated watering schedule tests  
npx playwright test tests/e2e/watering/watering-schedule-calculation.spec.ts

# Run unit tests
npx vitest run src/utils/__tests__/watering-schedule.test.ts
```

### All Tests Together
```bash
# Run all watering schedule tests
npx playwright test tests/e2e/watering/
```

## Success Criteria

Before shipping, all tests should pass and verify:

✅ **Calendar date calculation works**: Simple date arithmetic without timezone considerations  
✅ **Tomorrow plants show correctly**: Plants due tomorrow display "Water tomorrow"  
✅ **Date display consistent**: Shown dates match calculation dates  
✅ **Fallback calculation works**: Manual calculation uses calendar dates  
✅ **Existing functionality preserved**: All previous tests still pass  
✅ **No timezone complexity**: No early morning adjustments or timezone conversions  

## Implementation Details

### Calendar Date Calculation Logic
```typescript
// Simple calendar date calculation - no timezone considerations
const currentDate = new Date();
const currentCalendarDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

const latestWateringDate = new Date(plant.latest_watering);
const wateredCalendarDate = new Date(latestWateringDate.getFullYear(), latestWateringDate.getMonth(), latestWateringDate.getDate());

const timeDiff = currentCalendarDate.getTime() - wateredCalendarDate.getTime();
const daysSinceWatering = Math.round(timeDiff / (1000 * 60 * 60 * 24));
const daysUntilWatering = wateringSchedule - daysSinceWatering;
```

### Why Calendar Dates Only?
- **Simpler logic**: No timezone conversions or early morning adjustments
- **Predictable behavior**: Plants watered on a date are always counted from that calendar date
- **User-friendly**: No confusion about timezones or complex date calculations
- **Maintainable**: Easier to understand and debug watering schedule issues

## Monitoring in Production

After deployment, monitor for:
- User reports of incorrect watering schedules
- Plants showing unexpected "days until watering" values
- Any confusion about watering dates or schedules
- Date display inconsistencies between cards and detail views
- Any plants with postponement history showing extra days
