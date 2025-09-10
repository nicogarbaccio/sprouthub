# Test User Management

## Problem

Our Playwright tests currently create new users with `Date.now()` timestamps in every test run:
- `testuser${Date.now()}`
- `plantmgr-${Date.now()}@example.com`

This leads to:
- ❌ Database bloat with orphaned test accounts
- ❌ No cleanup mechanism for test data
- ❌ Potential performance impact over time

## Solutions

### Option 1: Test User Pool (Recommended)

Use a small pool of pre-defined test users instead of creating new ones:

```typescript
import { getTestUser } from '../test-user-pool';

// Get a consistent test user for this test
const testUser = getTestUser('my-test-name');
```

**Benefits:**
- ✅ No new users created per test
- ✅ Consistent test behavior
- ✅ Faster test execution
- ✅ Minimal database impact

**When to use:** Most tests that don't require completely isolated user data

### Option 2: Unique Users with Cleanup

For tests that need isolated users:

```typescript
import { createUniqueTestUser } from '../test-user-pool';

// Create a unique user (will be cleaned up by global teardown)
const testUser = createUniqueTestUser('mytest');
```

**When to use:** Tests that modify user data in ways that could affect other tests

## Cleanup Implementation

### Current Status
- ✅ Cleanup framework added to `global-teardown.ts`
- ✅ Test user identification patterns defined
- ⚠️  **Actual cleanup logic needs implementation**

### To Implement Cleanup

Update `tests/test-user-cleanup.ts` with your actual user deletion API:

```typescript
export async function cleanupTestUsers(options: TestUserCleanupOptions = {}): Promise<void> {
  try {
    // Replace with your actual implementation
    const testUsers = await yourAPI.findUsers({
      emailPatterns: ['testuser', 'plantmgr-', 'e2etest'],
      olderThan: options.maxAge || 1 // hours
    });
    
    for (const user of testUsers) {
      await yourAPI.deleteUser(user.id);
      console.log(`Deleted test user: ${user.email}`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't break tests
  }
}
```

## Migration Guide

### Update Existing Tests

**Before:**
```typescript
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  username: `testuser${Date.now()}`,
  email: `test-${Date.now()}@example.com`,
  // ...
};
```

**After:**
```typescript
import { getTestUser } from '../test-user-pool';

const testUser = getTestUser('my-test-description');
```

### Test User Patterns

The cleanup system identifies test users by these patterns:
- Emails containing: `testuser`, `plantmgr`, `test-`, `e2etest`
- Usernames containing: same patterns
- Domain: `@sprouthub-test.local` (for pooled users)

## Best Practices

1. **Use pooled users by default** - faster and cleaner
2. **Use unique users sparingly** - only when you need complete isolation  
3. **Implement actual cleanup** - connect to your user deletion API
4. **Test cleanup in staging** - verify it works before production
5. **Monitor test user growth** - ensure cleanup is working

## Configuration

### Dry Run Mode
Test cleanup without actually deleting:

```typescript
await cleanupTestUsers({ dryRun: true });
```

### Age Filtering
Only clean up old test users:

```typescript
await cleanupTestUsers({ maxAge: 24 }); // 24 hours
```

## Security Notes

- Use separate test database/environment when possible
- Test users should use `.local` or test-specific domains
- Never run cleanup against production user accounts
- Implement proper user identification patterns