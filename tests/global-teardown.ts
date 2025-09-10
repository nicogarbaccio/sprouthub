import { FullConfig } from '@playwright/test';
import { cleanupTestUsers } from './test-user-cleanup';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up test users created during test runs
    await cleanupTestUsers({
      dryRun: process.env.CLEANUP_DRY_RUN === 'true', // Allow env override for safety
      maxAge: parseInt(process.env.CLEANUP_MAX_AGE_HOURS || '1') // Only clean up test users older than specified hours (default 1)
    });
    
    // Add other cleanup tasks here if needed
    // For example: clearing test data, closing connections, etc.
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - we don't want teardown failures to break the test run
  }
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
