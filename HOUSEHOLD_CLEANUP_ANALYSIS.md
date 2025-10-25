# Household Feature - Cleanup Analysis & Fixes

## Issues Found

### 1. **Playwright Tests Not Cleaning Up After Each Test** ❌

**Problem:**
- The test file [household-permissions.spec.ts](tests/e2e/households/household-permissions.spec.ts) creates test households but only relied on global teardown
- If a test fails or is interrupted, households persist in the database
- No `afterEach` hook to clean up created households

**Impact:**
- Test households accumulate in your database over time
- Affects test isolation - tests may interfere with each other
- Your `garbaccio20@gmail.com` account has leftover test households

**Fix Applied:** ✅
- Added `afterEach` hook that tracks household count before/after each test
- Automatically deletes households created during the test
- Falls back to global teardown if per-test cleanup fails

### 2. **Global Cleanup Only Runs at End of All Tests** ⚠️

**Problem:**
- [global-teardown.ts](tests/global-teardown.ts) only runs after ALL tests complete
- If you interrupt tests (Ctrl+C), cleanup never runs
- Cleanup is delayed, allowing test data to accumulate

**Impact:**
- Manual interruption of tests leaves orphaned households
- Long-running test suites accumulate data before cleanup

**Fix Applied:** ✅
- Added per-test cleanup as the first line of defense
- Global teardown remains as a safety net
- Improved cleanup script to handle edge cases

### 3. **Cleanup Pattern Too Restrictive** ⚠️

**Problem:**
- Original cleanup only matched `Test Household%` (households starting with "Test Household")
- Households with different naming patterns would be missed

**Fix Applied:** ✅
- Changed pattern to `%Test Household%` (matches anywhere in the name)
- All test households now caught by cleanup

### 4. **No Direct Deletion Support via RPC** ℹ️

**Problem:**
- The cleanup script tried direct DELETE queries
- Row Level Security (RLS) policies may prevent direct deletes
- No check if RPC function `delete_household` exists

**Fix Applied:** ✅
- Try RPC function first (respects RLS and business logic)
- Fall back to direct DELETE if RPC doesn't exist
- Better error handling and logging

### 5. **Feature Implementation Issues** ⚠️

**Potential Issues in the Household Feature:**

1. **No Cascade Delete Configuration**
   - When households are deleted, related records may not be cleaned up
   - Check database schema for CASCADE DELETE on:
     - `household_members`
     - `household_invitations`
     - `household_plants` (if exists)

2. **RLS Policies May Block Cleanup**
   - If RLS policies are too restrictive, cleanup might fail
   - The `deleteHousehold` function in [useHouseholds.ts:413-475](src/hooks/useHouseholds.ts#L413-L475) requires user to be owner
   - Cleanup scripts may not have proper permissions

3. **Soft Delete vs Hard Delete**
   - Feature uses hard deletes (`.delete()`)
   - No "archived" or "soft delete" state
   - Consider if this is desired behavior

## Fixes Applied

### 1. Enhanced Test Cleanup
- ✅ Added `afterEach` hook to [household-permissions.spec.ts](tests/e2e/households/household-permissions.spec.ts)
- ✅ Tracks household count before/after each test
- ✅ Deletes newly created households automatically
- ✅ Graceful error handling with fallback to global cleanup

### 2. Improved Cleanup Utility
- ✅ Enhanced [test-household-cleanup.ts](tests/test-household-cleanup.ts)
- ✅ Better pattern matching (`%Test Household%`)
- ✅ Tries RPC function first, falls back to direct delete
- ✅ Authentication status checking
- ✅ More detailed logging

### 3. Manual Cleanup Script
- ✅ Created [scripts/cleanup-test-households.ts](scripts/cleanup-test-households.ts)
- ✅ Added npm scripts:
  - `npm run cleanup:households` - Run cleanup
  - `npm run cleanup:households:dry-run` - Preview without deleting

## How to Clean Up Your Existing Test Households

### Option 1: Run the Cleanup Script (Recommended)

First, preview what will be deleted:
```bash
npm run cleanup:households:dry-run
```

Then run the actual cleanup:
```bash
npm run cleanup:households
```

### Option 2: Run Playwright Tests
The global teardown will clean up test households when tests complete:
```bash
npm test
```

### Option 3: Manual Deletion in Supabase
1. Go to your Supabase dashboard
2. Navigate to Table Editor → `households`
3. Filter by `name` contains "Test Household"
4. Delete rows manually

## Testing the Fix

Run the household tests to verify cleanup works:
```bash
npm test tests/e2e/households/household-permissions.spec.ts
```

Check console output for cleanup messages:
- `🧹 Cleaning up X test household(s)...`
- `✅ Deleted test household: ...`

## Database Schema Recommendations

Check your database schema for these improvements:

### 1. Add CASCADE DELETE
```sql
ALTER TABLE household_members
DROP CONSTRAINT IF EXISTS household_members_household_id_fkey,
ADD CONSTRAINT household_members_household_id_fkey
  FOREIGN KEY (household_id)
  REFERENCES households(id)
  ON DELETE CASCADE;

ALTER TABLE household_invitations
DROP CONSTRAINT IF EXISTS household_invitations_household_id_fkey,
ADD CONSTRAINT household_invitations_household_id_fkey
  FOREIGN KEY (household_id)
  REFERENCES households(id)
  ON DELETE CASCADE;
```

### 2. Add Soft Delete (Optional)
```sql
ALTER TABLE households
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update RLS policies to exclude deleted households
-- Update queries to filter WHERE deleted_at IS NULL
```

### 3. Create RPC for Admin Cleanup
```sql
CREATE OR REPLACE FUNCTION cleanup_test_households()
RETURNS TABLE(deleted_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_household RECORD;
BEGIN
  FOR v_household IN
    SELECT id, name
    FROM households
    WHERE name ILIKE '%Test Household%'
  LOOP
    BEGIN
      DELETE FROM households WHERE id = v_household.id;
      v_deleted_count := v_deleted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_deleted_count, v_failed_count;
END;
$$;
```

## Prevention - Best Practices

### For Tests:
1. ✅ Always use consistent naming: `Test Household ${Date.now()}`
2. ✅ Clean up in `afterEach` hooks
3. ✅ Use global teardown as safety net
4. ✅ Run cleanup script before/after test sessions

### For Feature:
1. Consider adding a "test mode" flag to households
2. Add database triggers for cascade cleanup
3. Implement soft deletes for important data
4. Add admin tools for bulk cleanup

## Summary

**Changes Made:**
1. ✅ Added per-test cleanup to household permission tests
2. ✅ Improved global cleanup utility
3. ✅ Created manual cleanup script
4. ✅ Added npm scripts for easy cleanup
5. ✅ Enhanced error handling and logging

**Next Steps:**
1. Run `npm run cleanup:households:dry-run` to see what will be deleted
2. Run `npm run cleanup:households` to clean up your existing test households
3. Run the tests to verify cleanup works properly
4. Consider implementing database schema improvements (CASCADE DELETE)

**Your test households should now be cleaned up automatically after each test run!** 🎉
