# Timezone and Calendar Logic Fix Tests

## Overview

This test suite verifies the fixes implemented to resolve timezone-related issues in watering schedule calculations. The primary issue was that plants watered late in the evening (which crossed midnight UTC) were showing incorrect watering schedules.

## Problem Background

### The Disco Pothos Bug
- **User expectation**: Plant watered "September 8th evening" → due September 15th → "Water in 5 days" on September 10th
- **Actual behavior**: Plant recorded as watered September 9th 00:14 UTC → due September 16th → "Water in 6 days"
- **Root cause**: Timezone conversion causing late evening waterings to be recorded as next day UTC

### Additional Issues Fixed
1. **Grace period confusion**: Plants with old postponement history were getting extra days added
2. **Inconsistent date display**: Dates shown vs. dates used in calculations were different
3. **Calendar vs. time-based logic**: Mixed approaches causing user confusion

## Test Coverage

### 1. Early Morning Watering Adjustment (`timezone-fixes.spec.ts`)

#### Test: "should handle early morning watering correctly (Disco Pothos scenario)"
- **Simulates**: Plant watered at `2025-09-09T00:14:32.009Z` (September 9th at 00:14 UTC)
- **Database**: `days_since_watering: 1` (Sep 9 → Sep 10 = 1 day)
- **Expected Fix**: Early morning adjustment adds +1 day → 2 days since watering
- **Result**: Shows "Water in 5 days" (7 - 2 = 5) and displays "Sep 8, 2025"

#### Test: "should NOT adjust normal daytime watering times"
- **Simulates**: Plant watered at `2025-09-08T14:30:00.000Z` (September 8th at 2:30 PM UTC)
- **Expected**: No adjustment applied, normal calculation
- **Result**: Shows "Water in 5 days" (7 - 2 = 5) and displays "Sep 8, 2025"

#### Test: "should handle edge case of exactly 04:00 UTC (boundary test)"
- **Simulates**: Plant watered at exactly `2025-09-08T04:00:00.000Z` (4:00 AM UTC)
- **Expected**: No adjustment (boundary condition: only < 4:00 gets adjusted)
- **Result**: Shows normal calculation without adjustment

### 2. Grace Period Removal

#### Test: "should verify grace period logic has been removed"
- **Simulates**: Plant with recent postponement history (`last_postponement_date` within old grace period)
- **Expected**: No additional days added due to postponement history
- **Result**: Shows actual calculation (10 - 2 = 8 days) without grace period

### 3. Multiple Plant Scenarios

#### Test: "should handle multiple early morning waterings correctly"
- **Tests**: Different early morning times (00:00, 03:59:59, 04:00:01)
- **Expected**: Only times < 04:00 UTC get adjusted
- **Results**: 
  - 00:00 UTC → adjusted → 5 days
  - 03:59 UTC → adjusted → 5 days  
  - 04:00 UTC → not adjusted → 6 days

### 4. Fallback Calculation

#### Test: "should handle fallback calculation with early morning adjustment"
- **Simulates**: Plant without `days_since_watering` (forces fallback calculation)
- **Expected**: Fallback logic also applies early morning adjustment
- **Result**: Consistent behavior between database and fallback calculations

## Updated Existing Tests (`watering-schedule-calculation.spec.ts`)

- Updated mock dates from 2024 to 2025 to match timezone fixes
- Verified existing functionality still works with new logic
- Confirmed postponed plants, overdue plants, and normal plants all calculate correctly

## Key Assertions

### Date Display Consistency
```typescript
// Verify early morning watering shows adjusted date
const lastWateredText = discoPothosCard.locator('text=/sep.*8.*2025/i');
await expect(lastWateredText).toBeVisible();
```

### Calculation Accuracy  
```typescript
// Verify correct days calculation with adjustment
const wateringStatus = discoPothosCard.locator('text=/water.*in.*5.*days?/i');
await expect(wateringStatus).toBeVisible();
```

### Grace Period Removal
```typescript
// Verify NO additional days are added
const noGracePeriodStatus = gracePeriodPlantCard.locator('text=/water.*in.*(9|10|11).*days?/i');
await expect(noGracePeriodStatus).not.toBeVisible();
```

## Running the Tests

### Individual Test Files
```bash
# Run timezone fixes tests
npx playwright test tests/e2e/watering/timezone-fixes.spec.ts

# Run updated watering schedule tests  
npx playwright test tests/e2e/watering/watering-schedule-calculation.spec.ts

# Run unit tests
npx vitest run src/utils/__tests__/watering-schedule.test.ts
```

### All Tests Together
```bash
# Run the comprehensive test script
./scripts/test-timezone-fixes.sh
```

## Success Criteria

Before shipping, all tests should pass and verify:

✅ **Early morning adjustment works**: 00:00-03:59 UTC waterings treated as previous day  
✅ **Boundary conditions correct**: 04:00+ UTC waterings not adjusted  
✅ **Grace period removed**: No additional days for plants with postponement history  
✅ **Date display consistent**: Shown dates match calculation dates  
✅ **Fallback calculation works**: Manual calculation handles early morning adjustment  
✅ **Existing functionality preserved**: All previous tests still pass  

## Implementation Details

### Early Morning Adjustment Logic
```typescript
// In watering schedule calculation
if (latestWateringDate.getUTCHours() < 4) {
  adjustedDaysSince += 1; // Add one day for early morning waterings
}

// In date formatting  
if (date.getUTCHours() < 4) {
  displayDate.setUTCDate(displayDate.getUTCDate() - 1); // Show previous day
}
```

### Why 4:00 AM UTC?
- Covers most timezone differences for evening waterings
- Conservative approach (only adjusts very early morning times)
- Clear boundary that's unlikely to affect normal watering times
- Handles common scenario of late evening watering crossing midnight

## Monitoring in Production

After deployment, monitor for:
- User reports of incorrect watering schedules
- Plants showing unexpected "days until watering" values
- Date display inconsistencies between cards and detail views
- Any plants with postponement history showing extra days
