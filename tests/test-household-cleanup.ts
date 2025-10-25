/**
 * Test household cleanup utilities for Playwright tests
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface TestHouseholdCleanupOptions {
  dryRun?: boolean;
  userEmail?: string; // Optional: clean up households for a specific user
  supabaseClient?: SupabaseClient; // Optional: provide an authenticated client
}

/**
 * Clean up test households created during test runs
 * Deletes all households with "Test Household" in the name
 * Also optionally cleans up all households for specific test users
 */
export async function cleanupTestHouseholds(options: TestHouseholdCleanupOptions = {}): Promise<void> {
  console.log('🏠 Cleaning up test households...');

  if (options.dryRun) {
    console.log('ℹ️  Dry run mode - no households will actually be deleted');
  }

  try {
    let supabase: SupabaseClient;

    // Use provided client or create a new one
    if (options.supabaseClient) {
      supabase = options.supabaseClient;
      console.log('✅ Using provided authenticated Supabase client');
    } else {
      // Import Supabase client dynamically
      const { createClient } = await import('@supabase/supabase-js');

      // Get Supabase credentials from environment
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase credentials in environment variables');
        return;
      }

      // Create a new client instance
      supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Get current session to check if we're authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthenticated = !!sessionData.session;

      if (!isAuthenticated) {
        console.log('⚠️  Not authenticated - cleanup will be limited to public operations');
        console.log('   Set TEST_EMAIL and TEST_PASSWORD in .env.local to authenticate');
      } else {
        console.log(`✅ Authenticated as ${sessionData.session?.user?.email}`);
      }
    }

    // Find test households (those with "Test Household" in the name)
    const { data: testHouseholds, error: queryError } = await supabase
      .from('households')
      .select('id, name, created_at, created_by')
      .ilike('name', '%Test Household%'); // Changed to match anywhere in the name

    if (queryError) {
      console.error('❌ Failed to query test households:', queryError);
      return;
    }

    if (!testHouseholds || testHouseholds.length === 0) {
      console.log('✅ No test households found to clean up');
      return;
    }

    console.log(`Found ${testHouseholds.length} test households to clean up`);

    if (options.dryRun) {
      testHouseholds.forEach(household => {
        console.log(`Would delete: ${household.name} - created ${household.created_at}`);
      });
      return;
    }

    // Delete test households
    let deletedCount = 0;
    let failedCount = 0;

    for (const household of testHouseholds) {
      try {
        // Try direct delete first (simpler approach)
        const { error } = await supabase
          .from('households')
          .delete()
          .eq('id', household.id);

        if (error) {
          console.error(`❌ Failed to delete household ${household.name}:`, error.message);
          failedCount++;
        } else {
          console.log(`✅ Deleted test household: ${household.name}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`❌ Error deleting household ${household.name}:`, err);
        failedCount++;
      }
    }

    if (failedCount > 0) {
      console.log(`⚠️  Test household cleanup completed: ${deletedCount}/${testHouseholds.length} households deleted, ${failedCount} failed`);
    } else {
      console.log(`✅ Test household cleanup completed: ${deletedCount}/${testHouseholds.length} households deleted`);
    }

  } catch (error) {
    console.error('❌ Test household cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't break tests
  }
}
