# MyPlantCard Dismissal Tests

## Overview

This directory contains tests to ensure that the insight dismissal functionality works correctly in the MyPlantCard component.

## Test Files

### 1. `useDismissedInsights.test.ts`
**Location:** `/src/hooks/__tests__/useDismissedInsights.test.ts`

Unit tests for the `useDismissedInsights` hook that manages dismissed insights persistence.

**Test Coverage:**
- ✅ Initial load from database
- ✅ Empty plant ID handling
- ✅ Database error handling
- ✅ Dismissing insights and updating local state
- ✅ Handling duplicate dismissals
- ✅ Filtering dismissed insights
- ✅ Checking if insights are dismissed
- ✅ Reloading dismissed insights
- ✅ Clearing all dismissals
- ✅ Dismissing multiple insights (Dismiss All scenario)
- ✅ Filtering after dismissing all
- ✅ Reload behavior after dismissing all

**Key Tests:**
1. **Load dismissed insights on mount** - Verifies the hook fetches and loads dismissed insights from the database when initialized
2. **Dismiss an insight** - Tests that dismissing an insight saves it to the database and updates local state
3. **Filter dismissed insights** - Ensures that dismissed insights are correctly filtered out from the list
4. **Reload mechanism** - Validates that the reload function correctly fetches updated data from the database
5. **Dismiss All scenario** - Tests dismissing multiple insights sequentially (simulating the "Dismiss All" button)
6. **Post-dismiss-all filtering** - Confirms all insights are filtered out after dismissing all
7. **Reload after Dismiss All** - Validates that dismissed insights persist after reload (no tips reappear)

### 2. E2E Tests (Recommended)
**Location:** `/e2e/` directory (Playwright tests)

For full integration testing of the MyPlantCard dismissal flow, we recommend using E2E tests with Playwright instead of component tests. This is because:
- MyPlantCard requires React Router context
- It depends on multiple contexts (BulkSelection, etc.)
- E2E tests better simulate real user interactions

**Recommended E2E Test Scenarios:**
1. Display badge when insights are available
2. Click badge to open modal
3. Dismiss an insight using the X button
4. Verify badge count decreases
5. Verify dismissed insight doesn't reappear on page refresh
6. Test per-plant dismissal state isolation

The hook tests (above) provide excellent unit test coverage of the core dismissal logic.

## Running the Tests

### Run all tests
```bash
npm test
```

### Run hook tests only
```bash
npm test -- src/hooks/__tests__/useDismissedInsights.test.ts
```

### Run E2E tests
```bash
npx playwright test
```

### Run in watch mode
```bash
npm test -- --watch
```

## What These Tests Protect Against

The tests ensure that the dismissal bug (where dismissed tips stayed visible on the card) never happens again by:

1. **Verifying the hook loads data correctly** - Ensures dismissed insights are fetched from the database
2. **Testing the reload mechanism** - Confirms that the parent component reloads its dismissed list when a child dismisses an insight
3. **Validating UI updates** - Checks that the badge count updates immediately after dismissal
4. **Testing edge cases** - Handles empty states, errors, and multi-plant scenarios

## Test Architecture

The tests use:
- **Vitest** as the test runner
- **React Testing Library** for component testing
- **Mock functions** to isolate component behavior from database calls
- **waitFor** for async operations

## Maintenance

When modifying the dismissal functionality:
1. Run these tests first to ensure they pass
2. Update tests if you change the dismissal behavior
3. Add new tests for any new dismissal-related features

## Future Test Ideas

Consider adding:
- E2E tests with Playwright to test the full user flow
- Tests for real-time updates when dismissals happen on other devices
- Performance tests for large numbers of dismissed insights
- Tests for offline dismissal and sync behavior
