/**
 * Enhanced test helpers for reliable cross-browser testing
 */

export interface TestEnvironmentState {
  hasPlatCards: boolean;
  plantCardCount: number;
  pageContent: string;
  mockDataActive: boolean;
  currentUrl: string;
  isAuthenticated: boolean;
  hasAuthButtons: boolean;
}

/**
 * Wait for mock data to be properly set up and intercepting
 */
export async function waitForMockData(page: any, options: { timeout?: number; verbose?: boolean } = {}): Promise<boolean> {
  const { timeout = 10000, verbose = false } = options;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const mockDataActive = await page.evaluate(() => {
      return !!(window as any).__mockDataActive && !!(window as any).__mockPlants;
    });
    
    if (mockDataActive) {
      if (verbose) console.log('✅ Mock data verification passed');
      return true;
    }
    
    await page.waitForTimeout(500);
  }
  
  if (verbose) console.log('❌ Mock data verification failed - timeout reached');
  return false;
}

/**
 * Verify that plant cards with mock data are actually rendered
 */
export async function verifyPlantsRendered(page: any, expectedPlants: string[], options: { timeout?: number; verbose?: boolean } = {}): Promise<boolean> {
  const { timeout = 15000, verbose = false } = options;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const plantCards = page.locator('[data-testid="plant-card"]');
    const count = await plantCards.count();
    
    if (count > 0) {
      // Check if we can find our expected plants
      const foundPlants = [];
      for (const plantName of expectedPlants) {
        const plantCard = plantCards.filter({ hasText: plantName });
        if (await plantCard.count() > 0) {
          foundPlants.push(plantName);
        }
      }
      
      if (foundPlants.length > 0) {
        if (verbose) console.log(`✅ Found ${foundPlants.length}/${expectedPlants.length} expected plants: ${foundPlants.join(', ')}`);
        return true;
      }
    }
    
    await page.waitForTimeout(1000);
  }
  
  if (verbose) {
    const count = await page.locator('[data-testid="plant-card"]').count();
    console.log(`❌ Plant verification failed - found ${count} cards but none with expected names: ${expectedPlants.join(', ')}`);
  }
  return false;
}

/**
 * Wait for catalog data to load (for real catalog tests)
 */
export async function waitForCatalogData(page: any, options: { timeout?: number; verbose?: boolean } = {}): Promise<boolean> {
  const { timeout = 15000, verbose = false } = options;
  
  try {
    // Wait for DOM to be ready first
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for plant cards to appear (element-based waiting)
    const plantCards = page.locator('[data-testid="plant-card"]');
    await plantCards.first().waitFor({ state: 'visible', timeout: timeout });
    
    const count = await plantCards.count();
    if (verbose) console.log(`✅ Catalog loaded with ${count} plants`);
    return count > 0;
    
  } catch (error) {
    if (verbose) console.log('❌ Catalog loading failed or no plants available');
    return false;
  }
}

/**
 * Get comprehensive test environment state for debugging
 */
export async function getTestEnvironmentState(page: any): Promise<TestEnvironmentState> {
  const plantCards = page.locator('[data-testid="plant-card"]');
  const plantCardCount = await plantCards.count();
  
  const mockDataActive = await page.evaluate(() => {
    return !!(window as any).__mockDataActive && !!(window as any).__mockPlants;
  });
  
  // Check for authentication indicators
  const addPlantButton = page.locator('button:has-text("Add Plant"), button:has-text("Add")');
  const signInButton = page.locator('button:has-text("Sign in"), a:has-text("Sign in")');
  
  const hasAddButton = await addPlantButton.isVisible({ timeout: 1000 }).catch(() => false);
  const hasSignInButton = await signInButton.isVisible({ timeout: 1000 }).catch(() => false);
  
  return {
    hasPlatCards: plantCardCount > 0,
    plantCardCount,
    pageContent: await page.textContent('body').then(text => text?.substring(0, 300) + '...').catch(() => 'Unable to get content'),
    mockDataActive,
    currentUrl: page.url(),
    isAuthenticated: hasAddButton && !hasSignInButton,
    hasAuthButtons: hasAddButton || hasSignInButton
  };
}

/**
 * Debug helper that logs current test environment state
 */
export async function debugTestEnvironment(page: any, testName: string) {
  console.log(`🔍 Debug info for test: ${testName}`);
  const state = await getTestEnvironmentState(page);
  console.log('📊 Environment State:', JSON.stringify(state, null, 2));
  
  // Additional debugging for plant cards
  if (state.plantCardCount > 0) {
    const plantCards = page.locator('[data-testid="plant-card"]');
    const first3Cards = await plantCards.locator('h3, h4').allTextContents().catch(() => []);
    console.log('🌱 Plant card names:', first3Cards.slice(0, 3));
  }
}

/**
 * Skip test with detailed logging if conditions aren't met
 */
export async function skipTestIfConditionNotMet(
  page: any, 
  testName: string, 
  condition: () => Promise<boolean>,
  reason: string
): Promise<boolean> {
  const shouldSkip = !(await condition());
  
  if (shouldSkip) {
    console.log(`⏭️ Skipping test '${testName}': ${reason}`);
    await debugTestEnvironment(page, testName);
    return true;
  }
  
  return false;
}

/**
 * Browser-aware wait helper - uses element-based waiting instead of networkidle
 */
export async function waitForStableContent(page: any, browserName?: string, options: { extraWait?: number } = {}) {
  // Wait for DOM to be ready
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for common page elements to indicate content is loaded
  const commonSelectors = [
    'h1', 'h2', // Main headings
    '[data-testid="plant-card"]', // Plant cards for catalog pages
    'main', // Main content area
    'nav' // Navigation
  ];
  
  // Try to wait for at least one common element to be visible
  let elementFound = false;
  for (const selector of commonSelectors) {
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 3000 });
      elementFound = true;
      break;
    } catch {
      // Continue to next selector
    }
  }
  
  // If no common elements found, just wait for a reasonable time
  if (!elementFound) {
    await page.waitForTimeout(2000);
  }
  
  const baseWait = browserName === 'firefox' || browserName === 'webkit' ? 2000 : 1000;
  const totalWait = baseWait + (options.extraWait || 0);
  
  await page.waitForTimeout(totalWait);
}

/**
 * Retry helper for flaky operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; verbose?: boolean } = {}
): Promise<T | null> {
  const { maxRetries = 3, delay = 1000, verbose = false } = options;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (verbose) console.log(`Retry attempt ${i + 1}/${maxRetries} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

/**
 * Find element with multiple selector strategies
 */
export async function findElementWithStrategies(
  page: any,
  selectors: string[],
  options: { timeout?: number; verbose?: boolean } = {}
): Promise<any | null> {
  const { timeout = 5000, verbose = false } = options;
  
  for (const selector of selectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: timeout / selectors.length }).catch(() => false)) {
        if (verbose) console.log(`✅ Found element with selector: ${selector}`);
        return element;
      }
    } catch (error) {
      if (verbose) console.log(`❌ Selector failed: ${selector}`);
    }
  }
  
  if (verbose) console.log(`❌ No element found with any selector: ${selectors.join(', ')}`);
  return null;
}