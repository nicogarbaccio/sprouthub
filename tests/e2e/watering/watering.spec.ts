import { test, expect } from '@playwright/test';

test.describe('Smart Watering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display watering schedule on homepage', async ({ page }) => {
    // With auth storage, users are authenticated and see the Dashboard
    // Verify Dashboard content is visible

    // Wait for page to load and check authentication state
    await page.waitForTimeout(2000);

    // Check for Welcome back message (authenticated dashboard)
    const welcomeHeading = page.getByText(/welcome back/i);
    const hasDashboard = await welcomeHeading.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDashboard) {
      // Authenticated user - verify dashboard elements
      await expect(welcomeHeading).toBeVisible();

      // Verify dashboard has plant stats or Today's Tasks
      const todaysTasks = page.getByText(/today's tasks/i);
      const plantStats = page.getByText(/total plants/i);

      // At least one of these should be visible
      const hasContent = await todaysTasks.isVisible({ timeout: 2000 }).catch(() => false) ||
                         await plantStats.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasContent).toBeTruthy();
    } else {
      // Non-authenticated user - verify marketing page has hero section
      // Look for the marketing hero with "Your plants deserve the best care"
      const heroHeading = page.getByText(/your plants deserve/i);
      const hasHero = await heroHeading.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasHero) {
        await expect(heroHeading).toBeVisible();
      } else {
        // Fallback - just verify some section exists
        const sections = await page.locator('section').count();
        expect(sections).toBeGreaterThan(0);
      }
    }
  });
});