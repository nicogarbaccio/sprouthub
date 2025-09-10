import { chromium, FullConfig } from '@playwright/test';
import { TIMEOUTS } from './config/timeouts';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the app to ensure it's running
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:8080');
    
    // Wait for the app to load - optimized for speed
    await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.SETUP_TEARDOWN });
    await page.waitForSelector('body', { timeout: TIMEOUTS.NAVIGATION });
    
    console.log('✅ App is running and accessible');
  } catch (error) {
    console.error('❌ Failed to connect to app:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;
