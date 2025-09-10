import { test, expect } from '@playwright/test';

test.describe('Plant Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plant-catalog');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display catalog page correctly', async ({ page }) => {
    // Verify main heading
    await expect(page.locator('h2')).toContainText('Find your next green companion');
    
    // Verify results summary
    await expect(page.locator('p:has-text("Showing")')).toBeVisible();
    
    // Verify sign up prompt
    await expect(page.locator('h3:has-text("preview")')).toBeVisible();
  });

  test('should show plant cards', async ({ page }) => {
    // Wait for plant cards to load using data-testid
    const plantCards = page.locator('[data-testid="plant-card"]');
    await expect(plantCards.first()).toBeVisible();
    
    // Verify at least some plants are shown
    const count = await plantCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify first card has required elements
    const firstCard = plantCards.first();
    await expect(firstCard.locator('h3')).toBeVisible(); // Plant name
    await expect(firstCard.locator('button:has-text("View Details")')).toBeVisible();
  });

  test('should navigate from homepage to catalog', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Start Growing")').click();
    
    await expect(page).toHaveURL(/.*plant-catalog/);
    await expect(page.locator('h2')).toContainText('Find your next green companion');
  });
});