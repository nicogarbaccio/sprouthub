import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Plant Management Lifecycle', () => {
  // Note: Authentication is handled automatically via storage state from playwright.config.ts
  // Tests will start with an authenticated session

  test('should display plant management UI when authenticated', async ({ page, authPage }) => {
    await page.goto('/my-plants');
    
    // Wait for page to be ready - network idle ensures data is loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for loading skeletons to disappear if present
    const loadingSkeleton = page.locator('[class*="skeleton"], [data-testid*="skeleton"], [class*="loading"]').first();
    if (await loadingSkeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingSkeleton).not.toBeVisible({ timeout: 5000 });
    }
    
    // Should show either plants or empty state
    const hasPlantCards = await page.getByTestId('plant-card').count() > 0;
    const hasEmptyState = await page.getByText(/no plants|add.*first.*plant/i).isVisible().catch(() => false);
    
    // At least one should be present
    if (!hasPlantCards && !hasEmptyState) {
      throw new Error('Expected either plant cards or empty state to be visible');
    }
    
    // Should have an add plant button
    await expect(page.getByRole('button', { name: /add.*plant/i }).first()).toBeVisible();
  });

  test('should navigate to catalog page', async ({ page, authPage }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on catalog page
    await expect(page).toHaveURL(/catalog/);
  });

  test('should allow watering a plant', async ({ page, authPage }) => {
    await page.goto('/my-plants');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if there are any plants
    const plantCards = await page.getByTestId('plant-card').count();
    
    if (plantCards === 0) {
      test.skip(true, 'No plants available to test watering');
      return;
    }
    
    // Look for a water button
    const waterButton = page.getByRole('button', { name: /water/i }).first();
    
    if (await waterButton.isVisible().catch(() => false)) {
      await waterButton.click();
      
      // Handle confirmation dialog if it appears
      const confirmDialog = page.getByRole('dialog').filter({ hasText: /confirm/i });
      if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmDialog.getByRole('button', { name: /confirm|water/i }).click();
      }
      
      // Should show success feedback
      await expect(
        page.getByText(/watered|success/i).first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'No plants currently need watering');
    }
  });

  test('should show consistent watering schedule display', async ({ page, authPage }) => {
    await page.goto('/my-plants');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to fully load (skeleton loaders to disappear)
    await page.waitForTimeout(2000);

    const plantCards = page.getByTestId('plant-card');
    const count = await plantCards.count();

    if (count === 0) {
      // Empty state is valid - check for empty state message
      await expect(page.getByText(/no plants|add.*first.*plant/i)).toBeVisible();
      return;
    }

    // We have plants - verify they show watering information
    // Each plant card should show watering status
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = plantCards.nth(i);

      // Should have some watering information visible
      const wateringText = card.getByText(/water in|due|last watered|next watering/i);
      await expect(wateringText.first()).toBeVisible({ timeout: 3000 });
    }
  });
});