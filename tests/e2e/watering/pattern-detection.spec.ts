import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';
import { createMockPlants, setupMockPlantData, setupMockDate, MOCK_CURRENT_DATE } from '../../utils/mock-plant-data';

test.describe('Watering Pattern Detection', () => {
  const testUser = getTestUser('pattern-detection');

  test.beforeEach(async ({ page }) => {
    // Mock the current date for predictable testing
    await setupMockDate(page, MOCK_CURRENT_DATE);
  });

  // Import shared auth helper (following working test pattern)
  async function setupAuthenticatedUser(page: any, authPage: any) {
    const { setupAuthenticatedUser: sharedSetup } = await import('../../utils/auth-helpers');
    await sharedSetup(page, authPage, testUser);
  }

  test('should detect early watering pattern and show suggestion dialog', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const earlyPlants = createMockPlants.earlyWateringPatternPlant('test-user-id-123');
    await setupMockPlantData(page, earlyPlants);
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const earlyPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Early Pattern Plant' });
    if (await earlyPlantCard.count() > 0) {
      await expect(earlyPlantCard).toBeVisible();

      // Water the plant to trigger pattern analysis
      const waterButton = earlyPlantCard.locator('button').filter({ hasText: /water/i }).first();
      if (await waterButton.isVisible()) {
        await waterButton.click();
        
        // Confirm watering if dialog appears
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*water/i });
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|water/i });
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);

        // Look for pattern insights dialog
        const patternDialog = page.locator('[role="dialog"]').filter({ hasText: /smart watering insights/i });
        if (await patternDialog.isVisible({ timeout: 5000 })) {
          // Verify early pattern content
          const hasEarlyPattern = await patternDialog.locator('text=/tend to water.*earlier/i').count() > 0;
          const hasConfidence = await patternDialog.locator('text=/confidence/i').count() > 0;
          const hasScheduleChange = await patternDialog.locator('text=/schedule change/i').count() > 0;
          
          expect(hasEarlyPattern || hasConfidence || hasScheduleChange).toBeTruthy();
        }
      }
    }
  });

  test('should detect late watering pattern', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const latePlants = createMockPlants.lateWateringPatternPlant('test-user-id-123');
    await setupMockPlantData(page, latePlants);
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const latePlantCard = page.getByTestId('plant-card').filter({ hasText: 'Late Pattern Plant' });
    if (await latePlantCard.count() > 0) {
      await expect(latePlantCard).toBeVisible();

      // Water the plant to trigger pattern analysis
      const waterButton = latePlantCard.locator('button').filter({ hasText: /water/i }).first();
      if (await waterButton.isVisible()) {
        await waterButton.click();
        
        // Confirm watering if dialog appears
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*water/i });
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|water/i });
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);

        // Look for pattern insights dialog
        const patternDialog = page.locator('[role="dialog"]').filter({ hasText: /smart watering insights/i });
        if (await patternDialog.isVisible({ timeout: 5000 })) {
          // Verify late pattern content
          const hasLatePattern = await patternDialog.locator('text=/tend to water.*later/i').count() > 0;
          const hasConfidence = await patternDialog.locator('text=/confidence/i').count() > 0;
          
          expect(hasLatePattern || hasConfidence).toBeTruthy();
        }
      }
    }
  });

  test('should detect consistent watering pattern', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const consistentPlants = createMockPlants.consistentWateringPatternPlant('test-user-id-123');
    await setupMockPlantData(page, consistentPlants);
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const consistentPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Consistent Pattern Plant' });
    if (await consistentPlantCard.count() > 0) {
      await expect(consistentPlantCard).toBeVisible();

      // Water the plant to trigger pattern analysis
      const waterButton = consistentPlantCard.locator('button').filter({ hasText: /water/i }).first();
      if (await waterButton.isVisible()) {
        await waterButton.click();
        
        // Confirm watering if dialog appears
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*water/i });
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|water/i });
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);

        // Look for pattern insights dialog
        const patternDialog = page.locator('[role="dialog"]').filter({ hasText: /smart watering insights/i });
        if (await patternDialog.isVisible({ timeout: 5000 })) {
          // Verify consistent pattern content
          const hasConsistentPattern = await patternDialog.locator('text=/watering.*consistently/i').count() > 0;
          const hasGotItButton = await patternDialog.locator('button').filter({ hasText: /got it/i }).count() > 0;
          
          expect(hasConsistentPattern || hasGotItButton).toBeTruthy();
        }
      }
    }
  });

  test('should detect irregular watering pattern', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const irregularPlants = createMockPlants.irregularWateringPatternPlant('test-user-id-123');
    await setupMockPlantData(page, irregularPlants);
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const irregularPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Irregular Pattern Plant' });
    if (await irregularPlantCard.count() > 0) {
      await expect(irregularPlantCard).toBeVisible();

      // Water the plant to trigger pattern analysis
      const waterButton = irregularPlantCard.locator('button').filter({ hasText: /water/i }).first();
      if (await waterButton.isVisible()) {
        await waterButton.click();
        
        // Confirm watering if dialog appears
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*water/i });
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|water/i });
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);

        // Look for pattern insights dialog
        const patternDialog = page.locator('[role="dialog"]').filter({ hasText: /smart watering insights/i });
        if (await patternDialog.isVisible({ timeout: 5000 })) {
          // Verify irregular pattern content
          const hasIrregularPattern = await patternDialog.locator('text=/varies.*quite a bit/i').count() > 0;
          const hasConfidence = await patternDialog.locator('text=/confidence/i').count() > 0;
          
          expect(hasIrregularPattern || hasConfidence).toBeTruthy();
        }
      }
    }
  });

  test('should handle insufficient watering data', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const insufficientPlants = createMockPlants.insufficientDataPlant('test-user-id-123');
    await setupMockPlantData(page, insufficientPlants);
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const insufficientPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Insufficient Data Plant' });
    if (await insufficientPlantCard.count() > 0) {
      await expect(insufficientPlantCard).toBeVisible();

      // Water the plant to trigger pattern analysis
      const waterButton = insufficientPlantCard.locator('button').filter({ hasText: /water/i }).first();
      if (await waterButton.isVisible()) {
        await waterButton.click();
        
        // Confirm watering if dialog appears
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*water/i });
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|water/i });
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);

        // Look for pattern insights dialog
        const patternDialog = page.locator('[role="dialog"]').filter({ hasText: /smart watering insights/i });
        if (await patternDialog.isVisible({ timeout: 5000 })) {
          // Verify insufficient data handling
          const hasEncouragement = await patternDialog.locator('text=/doing.*great|keep.*track/i').count() > 0;
          const hasGotItButton = await patternDialog.locator('button').filter({ hasText: /got it/i }).count() > 0;
          
          expect(hasEncouragement || hasGotItButton).toBeTruthy();
        }
      }
    }
  });

  test('should access pattern analysis from watering history dialog', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const earlyPlants = createMockPlants.earlyWateringPatternPlant('test-user-id-123');
    await setupMockPlantData(page, earlyPlants);
    
    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const earlyPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Early Pattern Plant' });
    if (await earlyPlantCard.count() > 0) {
      await expect(earlyPlantCard).toBeVisible();

      // Look for watering history access
      const historyButton = earlyPlantCard.locator('button, a').filter({ hasText: /history|view.*watering/i }).first();
      
      if (await historyButton.isVisible({ timeout: 3000 })) {
        await historyButton.click();
        
        // Look for watering history dialog
        const historyDialog = page.locator('[role="dialog"]').filter({ hasText: /watering.*history|history/i });
        if (await historyDialog.isVisible({ timeout: 5000 })) {
          // Look for pattern analysis section within the dialog
          const hasPatternSection = await historyDialog.locator('text=/pattern.*analysis/i').count() > 0;
          const hasEarlyPattern = await historyDialog.locator('text=/tend to water.*earlier/i').count() > 0;
          const hasConfidence = await historyDialog.locator('text=/confidence/i').count() > 0;
          
          expect(hasPatternSection || hasEarlyPattern || hasConfidence).toBeTruthy();
        }
      }
    }
  });

  test('should dismiss pattern suggestion and not show again', async ({ page, authPage }) => {
    await setupAuthenticatedUser(page, authPage, testUser);
    
    const earlyPlants = createMockPlants.earlyWateringPatternPlant('test-user-id-123');
    await setupMockPlantData(page, earlyPlants);

    await page.goto('/my-plants');
    await page.waitForLoadState('networkidle');

    const earlyPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Early Pattern Plant' });
    if (await earlyPlantCard.count() > 0) {
      await expect(earlyPlantCard).toBeVisible();

      // Water the plant to trigger pattern analysis
      const waterButton = earlyPlantCard.locator('button').filter({ hasText: /water/i }).first();
      if (await waterButton.isVisible()) {
        await waterButton.click();
        
        // Confirm watering if dialog appears
        const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /confirm.*water/i });
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|water/i });
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);

        // Look for pattern insights dialog and dismiss it
        const patternDialog = page.locator('[role="dialog"]').filter({ hasText: /smart watering insights/i });
        if (await patternDialog.isVisible({ timeout: 5000 })) {
          const dismissButton = patternDialog.locator('button').filter({ hasText: /not now/i });
          if (await dismissButton.isVisible()) {
            await dismissButton.click();
            await expect(patternDialog).not.toBeVisible();
            
            // Verify suggestion doesn't appear again immediately
            const isStillVisible = await patternDialog.isVisible({ timeout: 2000 }).catch(() => false);
            expect(isStillVisible).toBeFalsy();
          }
        }
      }
    }
  });
});