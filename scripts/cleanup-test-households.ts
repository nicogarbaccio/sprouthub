/**
 * Manual cleanup script for test households
 * Run this to clean up test households from your account
 *
 * Usage:
 *   npx tsx scripts/cleanup-test-households.ts
 *   npx tsx scripts/cleanup-test-households.ts --dry-run  # Preview without deleting
 *
 * Note: This script requires authentication. Make sure you're signed in to the app
 * or set TEST_EMAIL and TEST_PASSWORD environment variables.
 */

import { cleanupTestHouseholds } from '../tests/test-household-cleanup';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function authenticate() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Try to authenticate with test user credentials
  const email = process.env.TEST_EMAIL || 'e2etest1@sprouthub-test.local';
  const password = process.env.TEST_PASSWORD || 'TestPassword123!';

  console.log(`🔐 Attempting to authenticate as ${email}...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.warn('⚠️  Authentication failed:', error.message);
    console.warn('   Cleanup will run with limited permissions');
    return null;
  }

  if (data.session) {
    console.log('✅ Authenticated successfully\n');
    return supabase;
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🚀 Starting manual test household cleanup...\n');

  // Try to authenticate and get authenticated client
  const authenticatedClient = await authenticate();

  if (dryRun) {
    console.log('Running in DRY RUN mode - no households will be deleted\n');
  } else {
    console.log('⚠️  WARNING: This will DELETE all test households!');
    console.log('   Test households are those with "Test Household" in the name\n');
  }

  await cleanupTestHouseholds({
    dryRun,
    supabaseClient: authenticatedClient || undefined
  });

  console.log('\n✅ Cleanup script completed');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Cleanup script failed:', error);
  process.exit(1);
});
