import { test, expect } from '@playwright/test';

test.describe('Plants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plant-catalog');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show plant details', async ({ page }) => {
    // Click first "View Details" button
    const viewDetailsButtons = page.locator('button:has-text("View Details")');
    await viewDetailsButtons.first().click();
    
    // Should navigate to plant details page
    await expect(page).toHaveURL(/.*plant-details/);
    
    // Should show plant information
    await expect(page.locator('h1')).toBeVisible(); // Plant name
  });

  test('should handle plant interactions', async ({ page }) => {
    // Verify plant cards are interactive using data-testid
    const plantCards = page.locator('[data-testid="plant-card"]');
    const firstCard = plantCards.first();
    
    // Test view details button
    await expect(firstCard.locator('button:has-text("View Details")')).toBeVisible();
    
    // Test sign in to add button
    await expect(firstCard.locator('button:has-text("Sign in to Add")')).toBeVisible();
  });
});