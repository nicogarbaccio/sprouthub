import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  // Add any cleanup tasks here
  // For example: clearing test data, closing connections, etc.
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
