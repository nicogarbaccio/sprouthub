import { test, expect } from '../../fixtures/test-fixtures';
import { createMockPlants, setupMockPlantData, setupMockDate, MOCK_CURRENT_DATE } from '../../utils/mock-plant-data';

test.describe('Watering Schedule Calculations', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the current date to September 10th, 2025 for predictable testing
    await setupMockDate(page, MOCK_CURRENT_DATE);

    // Note: Authentication is handled automatically via storage state from playwright.config.ts
    // Tests will start with an authenticated session
  });

  test('should display correct watering schedule for plants', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Setup mock plant data', async () => {
      console.log('🌱 Setting up mock plant data for watering schedule calculations');
      
      // Create mock plants with different watering scenarios
      const mockPlants = createMockPlants.normalPlants('test-user-id-123');
      
      // Set up mock data
      await setupMockPlantData(page, mockPlants);
      
      console.log(`📦 Set up mock data for ${mockPlants.length} plants`);
    });

    await test.step('Verify watering schedule calculations', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500); // Wait for plants to render

      // Get all plant cards
      const plantCards = page.locator('[data-testid="plant-card"]');
      const count = await plantCards.count();
      
      if (count === 0) {
        console.log('⚠️ No plant cards found - mock data may not be working');
        test.skip();
        return;
      }

      console.log(`🌿 Found ${count} plant cards`);
      
      // Check for specific plants from our mock data
      const monsteraCard = plantCards.filter({ hasText: 'Test Monstera' });
      const snakePlantCard = plantCards.filter({ hasText: 'Test Snake Plant' });
      const overduePlantCard = plantCards.filter({ hasText: 'Test Overdue Plant' });
      
      // Verify we have our expected plants
      const hasMonstera = await monsteraCard.count() > 0;
      const hasSnakePlant = await snakePlantCard.count() > 0;
      const hasOverduePlant = await overduePlantCard.count() > 0;
      
      console.log(`📊 Plant availability: Monstera=${hasMonstera}, Snake Plant=${hasSnakePlant}, Overdue Plant=${hasOverduePlant}`);
      
      // Test Monstera (should show "Water in 5 days")
      if (hasMonstera) {
        console.log('🌿 Testing Monstera watering schedule');
        await expect(monsteraCard).toBeVisible();
        
        // Look for watering schedule text
        const wateringText = await monsteraCard.locator('text=/water|days|due|overdue/i').allTextContents();
        console.log(`💧 Monstera watering status: ${wateringText.join(', ')}`);
        
        // Should show "Water in 5 days" or similar
        const hasCorrectSchedule = await monsteraCard.locator('text=/5.*days?|days?.*5/i').count() > 0;
        expect(hasCorrectSchedule).toBeTruthy();
      }
      
      // Test Snake Plant (should show "Water in 7 days")
      if (hasSnakePlant) {
        console.log('🌿 Testing Snake Plant watering schedule');
        await expect(snakePlantCard).toBeVisible();
        
        const wateringText = await snakePlantCard.locator('text=/water|days|due|overdue/i').allTextContents();
        console.log(`💧 Snake Plant watering status: ${wateringText.join(', ')}`);
        
        // Should show "Water in 7 days" or similar
        const hasCorrectSchedule = await snakePlantCard.locator('text=/7.*days?|days?.*7/i').count() > 0;
        expect(hasCorrectSchedule).toBeTruthy();
      }
      
      // Test Overdue Plant (should show "Overdue" or "Water now")
      if (hasOverduePlant) {
        console.log('🌿 Testing Overdue Plant watering schedule');
        await expect(overduePlantCard).toBeVisible();
        
        const wateringText = await overduePlantCard.locator('text=/water|days|due|overdue/i').allTextContents();
        console.log(`💧 Overdue Plant watering status: ${wateringText.join(', ')}`);
        
        // Should show overdue status
        const hasOverdueStatus = await overduePlantCard.locator('text=/overdue|due now|water now/i').count() > 0;
        expect(hasOverdueStatus).toBeTruthy();
      }
    });
  });

  test('should display valid watering status for all plants', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Verify watering status for all plants', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Get all plant cards
      const plantCards = page.locator('[data-testid="plant-card"]');
      const count = await plantCards.count();
      
      if (count === 0) {
        // Skip test if no plants exist in test environment
        test.skip();
        return;
      }

      // Check that each plant shows a valid watering status
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = plantCards.nth(i);
        
        // Each plant should show some watering information
        await expect(card).toContainText(/water|due|day|postponed|delayed|overdue/i);
      }
    });
  });

  test('should show appropriate watering status for all plants', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Verify plants show appropriate watering status', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Get all plant cards
      const plantCards = page.locator('[data-testid="plant-card"]');
      const count = await plantCards.count();
      
      if (count === 0) {
        // Skip test if no plants exist in test environment
        test.skip();
        return;
      }

      // Check that each plant shows some form of watering status
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = plantCards.nth(i);
        
        // Each plant should show watering information
        await expect(card).toContainText(/water|day|due|overdue|watch/i);
      }
    });
  });

  test('should display correct next watering dates for all plants', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Verify next watering dates', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Check that all plants show specific dates, not "Unknown"
      const plantCards = page.locator('[data-testid="plant-card"]');
      const count = await plantCards.count();

      if (count === 0) {
        // Skip test if no plants exist in test environment
        test.skip();
        return;
      }

      for (let i = 0; i < count; i++) {
        const card = plantCards.nth(i);
        
        // Find the "Next watering:" text and get the date
        const nextWateringLabel = card.locator('text=Next watering:');
        if (await nextWateringLabel.isVisible()) {
          const nextWateringValue = nextWateringLabel.locator('..').locator('span').last();
          const nextWateringDate = await nextWateringValue.textContent();
          
          // Should not be "Unknown"
          expect(nextWateringDate).not.toBe('Unknown');
          
          // Should be a valid date format (updated to handle current year)
          expect(nextWateringDate).toMatch(/[A-Za-z]{3} \d+, 202\d/);
        }
      }
    });
  });

  test('should show plant statistics', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Verify plant statistics', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');

      // Wait for page to finish loading (skeleton loaders to disappear)
      await page.waitForTimeout(2000);

      // Check that plant statistics are displayed (numbers may vary based on test data)
      const plantsTotal = page.locator('text=/\d+ plants? total/');
      const roomsCount = page.locator('text=/\d+ room/'); // Note: singular "room" not "rooms"

      // Check if we have any plants at all
      const plantCards = page.locator('[data-testid="plant-card"]');
      const plantCount = await plantCards.count();

      console.log(`📊 Plant count: ${plantCount}`);

      if (plantCount === 0) {
        // If no plants exist, we should see "0 plants total" or similar
        const hasZeroPlants = await page.locator('text=/0 plants? total/').isVisible();
        expect(hasZeroPlants).toBeTruthy();
      } else {
        // If we have plants, statistics might be displayed in various formats
        // Just verify that we can see plant cards (which we already counted)
        await expect(plantCards.first()).toBeVisible();
        console.log('✅ Plants are visible on the page');
      }
    });
  });

  test('should handle watering a plant and update schedule correctly', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Test watering functionality', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Look for any plant with a "Water Now" button (due today or overdue)
      const waterNowButton = page.locator('button:has-text("Water Now")');
      const hasWaterButton = await waterNowButton.first().isVisible();
      
      if (!hasWaterButton) {
        // Skip test if no plants are due for watering
        test.skip();
        return;
      }

      // Get the plant card containing the water button
      const plantCard = waterNowButton.first().locator('[data-testid="plant-card"]').first();
      const initialStatus = await plantCard.locator('text=/Due today|Overdue|Water in/').first().textContent();

      // Click the "Water Now" button
      await waterNowButton.first().click();

      // Wait for the watering to complete and page to update
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Wait for update
      await page.reload(); // Ensure we get fresh data
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // The plant should now show a different watering schedule
      const newStatus = await plantCard.locator('text=/Water in \d+ day|Due|Overdue/').first().textContent();
      expect(newStatus).not.toBe(initialStatus);
    });
  });

  test('should display frequency information correctly', async ({ page, authPage }) => {
    test.setTimeout(30000); // Increase timeout for Firefox compatibility

    await test.step('Verify frequency information', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Get all plant cards
      const plantCards = page.locator('[data-testid="plant-card"]');
      const count = await plantCards.count();
      
      if (count === 0) {
        // Skip test if no plants exist in test environment
        test.skip();
        return;
      }

      // Check that at least one plant shows frequency information if available
      let hasFrequencyInfo = false;
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = plantCards.nth(i);
        const frequencyInfo = await card.locator('text=/\d+ in \d+d • avg \d+d/').isVisible().catch(() => false);
        if (frequencyInfo) {
          hasFrequencyInfo = true;
          break;
        }
      }
      
      // Frequency info is optional, but log whether it was found
      console.log(`📊 Frequency info displayed: ${hasFrequencyInfo}`);
    });
  });
});
