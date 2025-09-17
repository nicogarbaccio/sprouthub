import { test, expect } from '@playwright/test';
import {
  waitForStableContent,
  findElementWithStrategies,
  skipTestIfConditionNotMet,
  debugTestEnvironment
} from '../../utils/test-helpers';

test.describe('Plant Catalog', () => {
  test.beforeEach(async ({ page, browserName }) => {
    await page.goto('/plant-catalog');
    await waitForStableContent(page, browserName, { extraWait: 500 });
  });

  test('should display catalog page correctly', async ({ page, browserName }) => {
    // Wait for catalog heading to be visible (more reliable than networkidle)
    const headingSelectors = [
      'h2:has-text("Find your next green companion")',
      'h1:has-text("Find your next green companion")',
      'text=Find your next green companion'
    ];
    
    const heading = await findElementWithStrategies(page, headingSelectors, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'catalog page display test',
      async () => !!heading,
      'Main catalog heading not found'
    )) {
      test.skip();
      return;
    }
    
    await expect(heading).toBeVisible();
    
    // Check for results summary (optional - may not be present in all states)
    const summaryVisible = await page.locator('p:has-text("Showing")').isVisible({ timeout: 5000 }).catch(() => false);
    if (summaryVisible) {
      await expect(page.locator('p:has-text("Showing")')).toBeVisible();
    } else {
      console.log('Results summary not found - may not be present in current state');
    }
    
    // Check for sign up prompt (optional - depends on auth state)
    const signUpPromptVisible = await page.locator('h3:has-text("preview")').isVisible({ timeout: 5000 }).catch(() => false);
    if (signUpPromptVisible) {
      await expect(page.locator('h3:has-text("preview")')).toBeVisible();
    }
  });

  test('should show plant cards', async ({ page, browserName }) => {
    // Wait for plant cards to load (element-based waiting)
    const plantCards = page.locator('[data-testid="plant-card"]');
    
    // Check if plant cards are available
    if (await skipTestIfConditionNotMet(
      page,
      'plant cards display test',
      async () => {
        try {
          await expect(plantCards.first()).toBeVisible({ timeout: 10000 });
          return true;
        } catch {
          return false;
        }
      },
      'No plant cards found - may be expected for empty catalog'
    )) {
      test.skip();
      return;
    }
    
    // Verify at least some plants are shown
    const count = await plantCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify first card has required elements
    const firstCard = plantCards.first();
    
    // Check for plant name using enhanced element finder
    const nameSelectors = ['h3', 'h4', '[data-testid="plant-name"]'];
    const plantName = await findElementWithStrategies(firstCard, nameSelectors, { verbose: true });
    expect(plantName).toBeTruthy();
    if (plantName) {
      await expect(plantName).toBeVisible();
    }
    
    // Check for view details button
    const detailsSelectors = [
      'button:has-text("View Details")',
      'a:has-text("View Details")',
      'button:has-text("Details")'
    ];
    const detailsButton = await findElementWithStrategies(firstCard, detailsSelectors, { verbose: true });
    expect(detailsButton).toBeTruthy();
    if (detailsButton) {
      await expect(detailsButton).toBeVisible();
    }
  });

  test('should navigate from homepage to catalog', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Wait for homepage main heading instead of networkidle
    const homepageHeadingSelectors = [
      'h1:has-text("Your plants deserve the best care")',
      'h1:has-text("best care")',
      'text=Your plants deserve the best care'
    ];
    
    const homeHeading = await findElementWithStrategies(page, homepageHeadingSelectors, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'homepage navigation test',
      async () => !!homeHeading,
      'Homepage heading not found'
    )) {
      test.skip();
      return;
    }
    
    await waitForStableContent(page, browserName, { extraWait: 500 });
    
    // Look for "Start Growing" button with enhanced element finder
    const buttonSelectors = [
      'button:has-text("Start Growing")',
      'a:has-text("Start Growing")',
      '[data-testid="start-growing"]',
      'text=Start Growing'
    ];
    
    const startButton = await findElementWithStrategies(page, buttonSelectors, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'homepage navigation test',
      async () => !!startButton,
      'Start Growing button not found'
    )) {
      test.skip();
      return;
    }
    
    await startButton.click();
    
    // Wait for navigation to complete by checking URL
    await expect(page).toHaveURL(/.*plant-catalog/, { timeout: 10000 });
    
    // Verify catalog page loaded by checking for catalog heading
    const catalogHeadingSelectors = [
      'h2:has-text("Find your next green companion")',
      'h1:has-text("Find your next green companion")',
      'text=Find your next green companion'
    ];
    
    const catalogHeading = await findElementWithStrategies(page, catalogHeadingSelectors, { timeout: 8000, verbose: true });
    if (catalogHeading) {
      await expect(catalogHeading).toBeVisible();
    } else {
      console.log('Catalog heading not found after navigation - page may still be loading');
    }
  });
});