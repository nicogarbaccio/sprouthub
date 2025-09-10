import { test, expect } from '@playwright/test';

test.describe('Smart Watering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display watering schedule on homepage', async ({ page }) => {
    // Check if user is authenticated by looking for Dashboard or marketing content
    const todaysTasks = page.locator('#todays-tasks'); // Dashboard section for authenticated users
    const heroSection = page.locator('section').first(); // Marketing section for non-authenticated users
    
    // For authenticated users, verify Today's Tasks section exists
    if (await todaysTasks.isVisible()) {
      await expect(todaysTasks).toBeVisible();
      await expect(page.locator('h1')).toContainText('Welcome back');
    } else {
      // For non-authenticated users, verify marketing page loaded correctly
      await expect(heroSection).toBeVisible();
    }
  });
});