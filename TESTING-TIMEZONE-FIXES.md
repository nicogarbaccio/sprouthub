# Testing Guide: Timezone and Watering Schedule Fixes

## Quick Start

Run all timezone-related tests before shipping:

```bash
./scripts/test-timezone-fixes.sh
```

## What We're Testing

### 🎯 Primary Fix: Early Morning Watering Adjustment
**Problem**: Plant watered at 11:30 PM local time → recorded as 00:14 UTC next day → wrong calculation  
**Solution**: Waterings between 00:00-04:00 UTC treated as previous calendar day  
**Test**: `timezone-fixes.spec.ts` → "Disco Pothos scenario"

### 🧹 Grace Period Removal  
**Problem**: Plants with old postponement history getting extra days added  
**Solution**: Removed grace period logic completely  
**Test**: `timezone-fixes.spec.ts` → "grace period logic has been removed"

### 📅 Calendar Logic Consistency
**Problem**: Date display vs calculation using different logic  
**Solution**: Consistent UTC-based calendar logic  
**Test**: Multiple tests verify date display matches calculations

## Test Files

1. **`tests/e2e/watering/timezone-fixes.spec.ts`** - New comprehensive tests for our fixes
2. **`tests/e2e/watering/watering-schedule-calculation.spec.ts`** - Updated existing tests  
3. **`src/utils/__tests__/watering-schedule.test.ts`** - Unit tests (36 tests)

## Key Test Scenarios

| Scenario | Input | Expected Output | Test Location |
|----------|--------|----------------|---------------|
| Early morning watering | `2025-09-09T00:14:32Z` | "Sep 8, 2025" + "Water in 5 days" | `timezone-fixes.spec.ts` |
| Normal daytime watering | `2025-09-08T14:30:00Z` | "Sep 8, 2025" + "Water in 5 days" | `timezone-fixes.spec.ts` |
| Boundary condition | `2025-09-08T04:00:00Z` | No adjustment applied | `timezone-fixes.spec.ts` |
| Grace period removal | Plant with postponement history | No extra days added | `timezone-fixes.spec.ts` |
| Fallback calculation | No `days_since_watering` | Consistent with database calc | `timezone-fixes.spec.ts` |

## Success Criteria ✅

Before shipping, verify:
- [ ] All Playwright tests pass (`npx playwright test tests/e2e/watering/`)
- [ ] All unit tests pass (`npx vitest run src/utils/__tests__/watering-schedule.test.ts`)
- [ ] Disco Pothos scenario shows "Water in 5 days" not "Water in 6 days"
- [ ] Early morning waterings (00:00-03:59 UTC) get adjusted
- [ ] Normal waterings (04:00+ UTC) don't get adjusted  
- [ ] No grace periods applied to any plants
- [ ] Date displays match calculation logic

## Manual Testing

If you want to test manually in the browser:
1. Create a plant with watering time `2025-09-09T00:14:32Z`
2. Set current date to `2025-09-10`
3. Verify it shows "Last watered: Sep 8, 2025" and "Water in 5 days"

## Files Modified

- `src/utils/watering-schedule.ts` - Main calculation logic
- `src/components/MyPlantsCollection.tsx` - Date formatting  
- `tests/e2e/watering/timezone-fixes.spec.ts` - New tests
- `tests/e2e/watering/watering-schedule-calculation.spec.ts` - Updated tests
- `scripts/test-timezone-fixes.sh` - Test runner script

## Deployment Checklist

- [ ] Run `./scripts/test-timezone-fixes.sh` - all tests pass
- [ ] No TypeScript errors in test files
- [ ] No linting errors in modified files  
- [ ] Verify existing functionality still works
- [ ] Test with real plant data if possible
- [ ] Monitor for user reports after deployment
