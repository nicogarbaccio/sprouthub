# Dismissed Suggestions - Cross-Device Sync Fix

## Problem

Schedule suggestions were being dismissed only in **localStorage** (browser-specific), which meant:
- Dismissals on desktop didn't sync to mobile
- Dismissals on one browser didn't sync to another browser
- Users saw the same suggestions repeatedly on different devices

## Solution

Created a database-backed dismissal system that:
1. Stores dismissals in a new `dismissed_suggestions` table in Supabase
2. Syncs across all devices when the user logs in
3. Maintains localStorage as a local cache for responsiveness
4. Automatically migrates existing localStorage dismissals to the database

## Files Changed

### 1. Database Migration
- **[migrations/20251218_create_dismissed_suggestions.sql](./20251218_create_dismissed_suggestions.sql)**
  - Creates `dismissed_suggestions` table
  - Adds RLS policies for user data security
  - Creates indexes for performance
  - Includes cleanup function for expired dismissals

### 2. New Hook for Database Sync
- **[src/hooks/useDismissedSuggestions.ts](../src/hooks/useDismissedSuggestions.ts)**
  - Manages dismissed suggestions with database persistence
  - Syncs with localStorage for offline support
  - Provides migration function for existing data
  - Auto-expires dismissals after 30 days

### 3. Updated Dashboard Component
- **[src/components/Dashboard.tsx](../src/components/Dashboard.tsx)**
  - Replaced localStorage-only state with database-backed hook
  - Simplified dismissal handlers
  - Added automatic migration on mount

### 4. TypeScript Types
- **[src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts)**
  - Added `dismissed_suggestions` table type definitions
  - Includes Row, Insert, Update, and Relationships types

## Database Schema

```sql
CREATE TABLE dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT NOT NULL CHECK (reason IN ('user_dismissed', 'applied', 'auto_expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, plant_id)
);
```

### Dismissal Reasons
- `user_dismissed` - User explicitly dismissed the suggestion
- `applied` - User applied the suggestion
- `auto_expired` - Automatically expired after 30 days

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/ufhjudswppdqupjbqbwm/editor
2. Open the SQL Editor
3. Copy the contents of `migrations/20251218_create_dismissed_suggestions.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI
```bash
# Login to Supabase CLI first
supabase login

# Link to your project
supabase link --project-ref ufhjudswppdqupjbqbwm

# Push the migration
supabase db push
```

## Testing the Fix

### Test Plan

1. **Desktop Browser Test**
   - Log in to the app on desktop
   - View schedule suggestions
   - Dismiss one or more suggestions
   - Log out

2. **Mobile Device Test**
   - Log in to the same account on mobile
   - Check that previously dismissed suggestions don't appear
   - Dismiss a different suggestion on mobile
   - Log out

3. **Cross-Device Verification**
   - Log back in on desktop
   - Verify that suggestions dismissed on mobile are also gone on desktop

4. **Migration Test** (for existing users)
   - Open browser console (F12)
   - Check for message: "Migrating X dismissals from localStorage to database..."
   - Verify no errors in console
   - Check that old dismissals still work

### Expected Behavior

✅ **Before Fix:**
- Dismissals only stored in localStorage
- Different dismissals on each device
- Suggestions reappear on new devices

✅ **After Fix:**
- Dismissals sync across all devices
- Consistent experience everywhere
- One-time automatic migration of old data

## Data Migration

The system automatically migrates existing localStorage dismissals to the database:
- Runs once when a user loads the Dashboard
- Preserves all existing dismissals
- Non-destructive (keeps localStorage as cache)
- Silent operation (logged to console only)

## Rollback Plan

If issues occur, you can rollback by:

1. **Remove the table:**
```sql
DROP TABLE IF EXISTS dismissed_suggestions CASCADE;
```

2. **Revert code changes:**
```bash
git revert HEAD
```

The app will fall back to localStorage-only behavior.

## Performance Notes

- **Indexes:** Created on `user_id`, `plant_id`, and `expires_at` for fast queries
- **Caching:** localStorage acts as a local cache for instant UI updates
- **Auto-cleanup:** Periodic cleanup of expired dismissals via `cleanup_expired_dismissals()` function
- **RLS:** Row-level security ensures users only see their own data

## Future Enhancements

Potential improvements:
- [ ] Add snooze functionality with time-based re-surfacing
- [ ] Track dismissal patterns for better ML recommendations
- [ ] Add analytics on which suggestions users ignore vs apply
- [ ] Implement suggestion fatigue detection

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify migration was applied successfully in Supabase
3. Confirm user is authenticated before dismissing
4. Check RLS policies are active on the table
