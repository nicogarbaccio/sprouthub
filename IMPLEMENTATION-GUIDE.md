# Test User Cleanup Implementation Guide

## What "Connect to Your User Management System" Means

The test cleanup I created is a **framework** that needs to be connected to your **Supabase database** to actually delete users. Here's exactly what you need to do:

## Step 1: Check Your Database Schema

First, find out what your user tables are called:

```sql
-- Log into your Supabase dashboard and run this query:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%' OR table_name LIKE '%profile%';
```

Common table names are:
- `profiles`
- `users` 
- `user_profiles`

## Step 2: Update the Table Name

In `tests/test-user-cleanup.ts`, line 56, change `'profiles'` to your actual table name:

```typescript
const { data: testUsers, error: queryError } = await supabase
  .from('YOUR_ACTUAL_TABLE_NAME') // ← Change this
  .select('id, email, username, created_at')
```

## Step 3: Create a Supabase Database Function (Recommended)

Since regular users can't delete other users, create a database function in Supabase:

```sql
-- Run this in your Supabase SQL Editor:
CREATE OR REPLACE FUNCTION delete_test_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from your profiles table
  DELETE FROM profiles WHERE id = user_id;
  
  -- Delete from auth.users (this requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
```

## Step 4: Alternative - Use Admin Client

If you prefer using the Supabase Admin API instead of a database function:

```typescript
// Create this file: tests/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ufhjudswppdqupjbqbwm.supabase.co'
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY' // From Supabase settings

export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

Then in `test-user-cleanup.ts`:
```typescript
// Replace line 90 with:
import { adminSupabase } from './supabase-admin';
const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
```

## Step 5: Test It (Safely!)

**IMPORTANT: Test in development/staging only!**

```bash
# Run with dry-run first to see what would be deleted
npm test -- --grep "verify plant management" 
# Check the teardown logs - should show "Would delete: ..."

# When ready, disable dry-run in global-teardown.ts:
# Change: dryRun: false
```

## Step 6: Adjust Column Names

Update the column names in the cleanup query based on your actual schema:

```typescript
// Line 57: Update these column names to match your table
.select('id, email, username, created_at')  // ← Adjust these

// Line 58: Update the search patterns
.or(`email.ilike.%testuser%,email.ilike.%plantmgr%,email.ilike.%test-%,username.ilike.%testuser%,username.ilike.%plantmgr%`)
```

## Common Issues & Solutions

### Issue: "relation 'profiles' does not exist"
**Solution**: Change the table name to match your schema

### Issue: "permission denied for table auth.users"  
**Solution**: Use the database function approach (Step 3)

### Issue: Import path errors
**Solution**: Adjust the import path in line 47:
```typescript
const { supabase } = await import('../src/integrations/supabase/client');
```

## Security Notes

⚠️ **NEVER run this against production users!**

- Use separate test database when possible
- Test users should have obvious test patterns in email/username
- Always test with `dryRun: true` first
- Consider time-based filters (only delete users older than X hours)

## Verification

After implementing, you should see output like this in test teardown:

```
🧹 Cleaning up test users...
Found 3 test users to clean up
✅ Deleted test user: testuser1234567890@example.com
✅ Deleted test user: plantmgr-1234567890@example.com
✅ Test user cleanup completed: 3/3 users deleted
```

## Need Help?

1. Check your Supabase dashboard for actual table names
2. Look at your existing user registration code to see how users are created
3. Test with `dryRun: true` to see what would be deleted
4. Start with the database function approach - it's safer