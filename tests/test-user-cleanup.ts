/**
 * Test user cleanup utilities for Playwright tests
 */

export const TEST_USER_PATTERNS = [
  'testuser',
  'plantmgr',
  'test-',
  'plantmgr-',
  '@sprouthub-test.local',
  'e2etest',
  'planttest',
  'authtest',
  'gardentest'
];

export interface TestUserCleanupOptions {
  dryRun?: boolean;
  maxAge?: number; // Hours
}

/**
 * Identifies test users that should be cleaned up
 */
export function isTestUser(email: string, username?: string): boolean {
  const emailLower = email.toLowerCase();
  const usernameLower = username?.toLowerCase() || '';
  
  return TEST_USER_PATTERNS.some(pattern => 
    emailLower.includes(pattern) || usernameLower.includes(pattern)
  );
}

/**
 * Actual implementation using Supabase to clean up test users
 */
export async function cleanupTestUsers(options: TestUserCleanupOptions = {}): Promise<void> {
  console.log('🧹 Cleaning up test users...');
  
  if (options.dryRun) {
    console.log('ℹ️  Dry run mode - no users will actually be deleted');
  }
  
  try {
    // Import Supabase client
    const { supabase } = await import('../src/integrations/supabase/client');
    
    // Find test users in your profiles table (adjust table name as needed)
    const maxAgeHours = options.maxAge || 24;
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    
    // Query for test users from auth.users table via profiles
    const { data: testUsers, error: queryError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        username,
        created_at
      `)
      .or(`email.ilike.%testuser%,email.ilike.%plantmgr%,email.ilike.%test-%,email.ilike.%@sprouthub-test.local%,email.ilike.%e2etest%,email.ilike.%planttest%,email.ilike.%authtest%,email.ilike.%gardentest%,username.ilike.%testuser%,username.ilike.%plantmgr%,username.ilike.%e2etest%,username.ilike.%planttest%,username.ilike.%authtest%,username.ilike.%gardentest%`)
      .lt('created_at', cutoffTime.toISOString());
    
    if (queryError) {
      console.error('❌ Failed to query test users:', queryError);
      return;
    }
    
    if (!testUsers || testUsers.length === 0) {
      console.log('✅ No test users found to clean up');
      return;
    }
    
    console.log(`Found ${testUsers.length} test users to clean up`);
    
    if (options.dryRun) {
      testUsers.forEach(user => {
        console.log(`Would delete: ${user.email} (${user.username}) - created ${user.created_at}`);
      });
      return;
    }
    
    // Delete users using the secure database function
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const user of testUsers) {
      try {
        const { data, error } = await supabase.rpc('delete_test_user', { user_id: user.id });
        
        if (error) {
          console.error(`❌ Failed to delete user ${user.email}:`, error.message);
          failedCount++;
        } else if (data && data.success) {
          console.log(`✅ Deleted test user: ${user.email}`);
          if (data.deleted_plants > 0) {
            console.log(`   └─ Cleaned up ${data.deleted_plants} plants and ${data.deleted_watering_records} watering records`);
          }
          deletedCount++;
        } else if (data && !data.success) {
          console.error(`❌ Failed to delete user ${user.email}: ${data.error}`);
          failedCount++;
        }
      } catch (err) {
        console.error(`❌ Error deleting user ${user.email}:`, err);
        failedCount++;
      }
    }
    
    if (failedCount > 0) {
      console.log(`⚠️  Test user cleanup completed: ${deletedCount}/${testUsers.length} users deleted, ${failedCount} failed`);
    } else {
      console.log(`✅ Test user cleanup completed: ${deletedCount}/${testUsers.length} users deleted`);
    }
    
  } catch (error) {
    console.error('❌ Test user cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't break tests
  }
}