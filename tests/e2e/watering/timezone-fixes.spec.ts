import { test, expect } from '@playwright/test';
import { getTestUser } from '../../test-user-pool';

test.describe('Timezone and Calendar Logic Fixes', () => {
  const testUser = getTestUser('timezone-fixes');

  test.beforeEach(async ({ page }) => {
    // Mock the current date to September 10th, 2025 for predictable testing
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-10T14:00:00Z'); // 2 PM UTC
      Date.now = () => mockDate.getTime();
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            // @ts-ignore - Playwright test environment
            super(...args);
          }
        }
        static now() {
          return mockDate.getTime();
        }
      } as DateConstructor;
    });
  });

  test('should handle early morning watering correctly (Disco Pothos scenario)', async ({ page }) => {
    await test.step('Setup authentication', async () => {
      await page.goto('/auth');
      
      const signUpButton = page.getByRole('button', { name: /sign up/i });
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      }
      
      await page.fill('[data-testid="sign-up-first-name"]', testUser.firstName);
      await page.fill('[data-testid="sign-up-last-name"]', testUser.lastName);
      await page.fill('[data-testid="sign-up-email"]', testUser.email);
      await page.fill('[data-testid="sign-up-password"]', testUser.password);
      await page.click('[data-testid="sign-up-submit"]');
      await page.waitForTimeout(2000);
    });

    await test.step('Mock early morning watering data', async () => {
      // This simulates the exact scenario from the Disco Pothos bug
      await page.route('**/api/plants*', async route => {
        const mockPlants = [
          {
            id: 'disco-pothos-test',
            nickname: 'Disco Pothos',
            plant_type: 'Pothos',
            suggested_watering_days: 7,
            latest_watering: '2025-09-09T00:14:32.009Z', // September 9th at 00:14 UTC (early morning)
            days_since_watering: 1, // Database says 1 day (Sep 9 to Sep 10)
            postponement_date: null,
            postponement_notes: null,
            last_postponement_date: null,
            postponement_count: null,
            image: 'https://example.com/disco-pothos.jpg'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlants)
        });
      });
    });

    await test.step('Verify early morning adjustment works', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const discoPothosCard = page.getByTestId('plant-card').filter({ hasText: 'Disco Pothos' });
      await expect(discoPothosCard).toBeVisible();
      
      // Should show "Water in 5 days" due to early morning adjustment
      // (00:14 UTC treated as previous day: 7 - 2 = 5 days)
      const wateringStatus = discoPothosCard.locator('text=/water.*in.*5.*days?/i');
      await expect(wateringStatus).toBeVisible();
      
      // Verify the last watered date shows September 8th (adjusted from September 9th)
      const lastWateredText = discoPothosCard.locator('text=/sep.*8.*2025/i');
      await expect(lastWateredText).toBeVisible();
    });
  });

  test('should NOT adjust normal daytime watering times', async ({ page }) => {
    await test.step('Setup authentication', async () => {
      await page.goto('/auth');
      
      const signUpButton = page.getByRole('button', { name: /sign up/i });
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      }
      
      await page.fill('[data-testid="sign-up-first-name"]', testUser.firstName);
      await page.fill('[data-testid="sign-up-last-name"]', testUser.lastName);
      await page.fill('[data-testid="sign-up-email"]', testUser.email);
      await page.fill('[data-testid="sign-up-password"]', testUser.password);
      await page.click('[data-testid="sign-up-submit"]');
      await page.waitForTimeout(2000);
    });

    await test.step('Mock normal daytime watering', async () => {
      await page.route('**/api/plants*', async route => {
        const mockPlants = [
          {
            id: 'normal-watering-test',
            nickname: 'Normal Watering Plant',
            plant_type: 'Monstera',
            suggested_watering_days: 7,
            latest_watering: '2025-09-08T14:30:00.000Z', // September 8th at 2:30 PM UTC (normal time)
            days_since_watering: 2, // Database says 2 days (Sep 8 to Sep 10)
            postponement_date: null,
            postponement_notes: null,
            last_postponement_date: null,
            postponement_count: null,
            image: 'https://example.com/monstera.jpg'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlants)
        });
      });
    });

    await test.step('Verify no adjustment for normal times', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const normalPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Normal Watering Plant' });
      await expect(normalPlantCard).toBeVisible();
      
      // Should show "Water in 5 days" with no adjustment (7 - 2 = 5 days)
      const wateringStatus = normalPlantCard.locator('text=/water.*in.*5.*days?/i');
      await expect(wateringStatus).toBeVisible();
      
      // Verify the last watered date shows September 8th (no adjustment needed)
      const lastWateredText = normalPlantCard.locator('text=/sep.*8.*2025/i');
      await expect(lastWateredText).toBeVisible();
    });
  });

  test('should handle edge case of exactly 04:00 UTC (boundary test)', async ({ page }) => {
    await test.step('Setup authentication', async () => {
      await page.goto('/auth');
      
      const signUpButton = page.getByRole('button', { name: /sign up/i });
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      }
      
      await page.fill('[data-testid="sign-up-first-name"]', testUser.firstName);
      await page.fill('[data-testid="sign-up-last-name"]', testUser.lastName);
      await page.fill('[data-testid="sign-up-email"]', testUser.email);
      await page.fill('[data-testid="sign-up-password"]', testUser.password);
      await page.click('[data-testid="sign-up-submit"]');
      await page.waitForTimeout(2000);
    });

    await test.step('Mock boundary time watering (04:00 UTC)', async () => {
      await page.route('**/api/plants*', async route => {
        const mockPlants = [
          {
            id: 'boundary-time-test',
            nickname: 'Boundary Time Plant',
            plant_type: 'Snake Plant',
            suggested_watering_days: 14,
            latest_watering: '2025-09-08T04:00:00.000Z', // September 8th at exactly 4:00 AM UTC (boundary)
            days_since_watering: 2, // Database says 2 days
            postponement_date: null,
            postponement_notes: null,
            last_postponement_date: null,
            postponement_count: null,
            image: 'https://example.com/snake-plant.jpg'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlants)
        });
      });
    });

    await test.step('Verify 04:00 UTC is NOT adjusted (boundary condition)', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const boundaryPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Boundary Time Plant' });
      await expect(boundaryPlantCard).toBeVisible();
      
      // Should show "Water in 12 days" with NO adjustment (14 - 2 = 12 days)
      // 04:00 UTC should NOT be adjusted (only < 4:00 gets adjusted)
      const wateringStatus = boundaryPlantCard.locator('text=/water.*in.*12.*days?/i');
      await expect(wateringStatus).toBeVisible();
      
      // Verify the last watered date shows September 8th (no adjustment)
      const lastWateredText = boundaryPlantCard.locator('text=/sep.*8.*2025/i');
      await expect(lastWateredText).toBeVisible();
    });
  });

  test('should verify grace period logic has been removed', async ({ page }) => {
    await test.step('Setup authentication', async () => {
      await page.goto('/auth');
      
      const signUpButton = page.getByRole('button', { name: /sign up/i });
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      }
      
      await page.fill('[data-testid="sign-up-first-name"]', testUser.firstName);
      await page.fill('[data-testid="sign-up-last-name"]', testUser.lastName);
      await page.fill('[data-testid="sign-up-email"]', testUser.email);
      await page.fill('[data-testid="sign-up-password"]', testUser.password);
      await page.click('[data-testid="sign-up-submit"]');
      await page.waitForTimeout(2000);
    });

    await test.step('Mock plant with recent postponement history', async () => {
      await page.route('**/api/plants*', async route => {
        const mockPlants = [
          {
            id: 'grace-period-test',
            nickname: 'Recent Postponement Plant',
            plant_type: 'Fiddle Leaf Fig',
            suggested_watering_days: 10,
            latest_watering: '2025-09-08T10:00:00.000Z', // September 8th at 10:00 AM UTC (normal time)
            days_since_watering: 2, // Database says 2 days
            postponement_date: null, // No active postponement
            postponement_notes: null,
            last_postponement_date: '2025-09-09T15:00:00.000Z', // Had postponement yesterday (within old grace period)
            postponement_count: 2, // Had multiple postponements
            image: 'https://example.com/fiddle-leaf.jpg'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlants)
        });
      });
    });

    await test.step('Verify NO grace period is applied', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const gracePeriodPlantCard = page.getByTestId('plant-card').filter({ hasText: 'Recent Postponement Plant' });
      await expect(gracePeriodPlantCard).toBeVisible();
      
      // Should show "Water in 8 days" with NO grace period applied (10 - 2 = 8 days)
      // Previously this would have shown 8 + grace period = 9 or 10 days
      const wateringStatus = gracePeriodPlantCard.locator('text=/water.*in.*8.*days?/i');
      await expect(wateringStatus).toBeVisible();
      
      // Should NOT show any additional days due to grace period
      const noGracePeriodStatus = gracePeriodPlantCard.locator('text=/water.*in.*(9|10|11).*days?/i');
      await expect(noGracePeriodStatus).not.toBeVisible();
    });
  });

  test('should handle multiple early morning waterings correctly', async ({ page }) => {
    await test.step('Setup authentication', async () => {
      await page.goto('/auth');
      
      const signUpButton = page.getByRole('button', { name: /sign up/i });
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      }
      
      await page.fill('[data-testid="sign-up-first-name"]', testUser.firstName);
      await page.fill('[data-testid="sign-up-last-name"]', testUser.lastName);
      await page.fill('[data-testid="sign-up-email"]', testUser.email);
      await page.fill('[data-testid="sign-up-password"]', testUser.password);
      await page.click('[data-testid="sign-up-submit"]');
      await page.waitForTimeout(2000);
    });

    await test.step('Mock multiple plants with different early morning times', async () => {
      await page.route('**/api/plants*', async route => {
        const mockPlants = [
          {
            id: 'early-1',
            nickname: 'Midnight Plant',
            plant_type: 'Pothos',
            suggested_watering_days: 7,
            latest_watering: '2025-09-09T00:00:00.000Z', // Exactly midnight UTC
            days_since_watering: 1,
            postponement_date: null,
            image: 'https://example.com/pothos1.jpg'
          },
          {
            id: 'early-2', 
            nickname: 'Pre-Dawn Plant',
            plant_type: 'Monstera',
            suggested_watering_days: 7,
            latest_watering: '2025-09-09T03:59:59.999Z', // Just before 4:00 AM UTC
            days_since_watering: 1,
            postponement_date: null,
            image: 'https://example.com/monstera1.jpg'
          },
          {
            id: 'normal-1',
            nickname: 'Morning Plant',
            plant_type: 'Snake Plant',
            suggested_watering_days: 7,
            latest_watering: '2025-09-09T04:00:01.000Z', // Just after 4:00 AM UTC
            days_since_watering: 1,
            postponement_date: null,
            image: 'https://example.com/snake1.jpg'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlants)
        });
      });
    });

    await test.step('Verify early morning plants get adjusted, others do not', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      // Midnight plant: should be adjusted (00:00 < 04:00) → 7 - 2 = 5 days
      const midnightCard = page.getByTestId('plant-card').filter({ hasText: 'Midnight Plant' });
      await expect(midnightCard.locator('text=/water.*in.*5.*days?/i')).toBeVisible();
      
      // Pre-dawn plant: should be adjusted (03:59 < 04:00) → 7 - 2 = 5 days
      const preDawnCard = page.getByTestId('plant-card').filter({ hasText: 'Pre-Dawn Plant' });
      await expect(preDawnCard.locator('text=/water.*in.*5.*days?/i')).toBeVisible();
      
      // Morning plant: should NOT be adjusted (04:00:01 >= 04:00) → 7 - 1 = 6 days
      const morningCard = page.getByTestId('plant-card').filter({ hasText: 'Morning Plant' });
      await expect(morningCard.locator('text=/water.*in.*6.*days?/i')).toBeVisible();
    });
  });

  test('should handle fallback calculation with early morning adjustment', async ({ page }) => {
    await test.step('Setup authentication', async () => {
      await page.goto('/auth');
      
      const signUpButton = page.getByRole('button', { name: /sign up/i });
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
      }
      
      await page.fill('[data-testid="sign-up-first-name"]', testUser.firstName);
      await page.fill('[data-testid="sign-up-last-name"]', testUser.lastName);
      await page.fill('[data-testid="sign-up-email"]', testUser.email);
      await page.fill('[data-testid="sign-up-password"]', testUser.password);
      await page.click('[data-testid="sign-up-submit"]');
      await page.waitForTimeout(2000);
    });

    await test.step('Mock plant without days_since_watering (fallback scenario)', async () => {
      await page.route('**/api/plants*', async route => {
        const mockPlants = [
          {
            id: 'fallback-test',
            nickname: 'Fallback Calculation Plant',
            plant_type: 'Rubber Tree',
            suggested_watering_days: 7,
            latest_watering: '2025-09-08T01:30:00.000Z', // September 8th at 1:30 AM UTC (early morning)
            days_since_watering: null, // No database calculation - forces fallback
            postponement_date: null,
            postponement_notes: null,
            last_postponement_date: null,
            postponement_count: null,
            image: 'https://example.com/rubber-tree.jpg'
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlants)
        });
      });
    });

    await test.step('Verify fallback calculation with early morning adjustment', async () => {
      await page.goto('/my-plants');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const fallbackCard = page.getByTestId('plant-card').filter({ hasText: 'Fallback Calculation Plant' });
      await expect(fallbackCard).toBeVisible();
      
      // Fallback should calculate: Sep 8 01:30 → adjusted to Sep 7, so Sep 7 to Sep 10 = 3 days
      // Result: 7 - 3 = 4 days remaining
      const wateringStatus = fallbackCard.locator('text=/water.*in.*4.*days?/i');
      await expect(wateringStatus).toBeVisible();
      
      // Verify the date display shows September 7th (adjusted from September 8th)
      const lastWateredText = fallbackCard.locator('text=/sep.*7.*2025/i');
      await expect(lastWateredText).toBeVisible();
    });
  });
});
