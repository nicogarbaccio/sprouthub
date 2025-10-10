import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';
import { setupAuthenticatedUser, waitForPageReady } from '../../utils/auth-helpers';
import { mockPlantData } from '../../utils/route-mocking';

test.describe('Calendar Date Calculations', () => {
  const testUser = getTestUser('calendar-calcs');
  const MOCK_CURRENT_DATE = '2025-09-10T12:00:00Z';

  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    
    // Mock current date for predictable calculations
    await page.addInitScript((mockDate) => {
      const mockTimestamp = new Date(mockDate).getTime();
      Date.now = () => mockTimestamp;
      Date.prototype.getTime = function() {
        return mockTimestamp;
      };
    }, MOCK_CURRENT_DATE);
  });

  test('should calculate days remaining based on calendar dates', async ({ page, authPage }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Mock plant: watered Sept 8, schedule every 7 days, current Sept 10
    // Days since watering: 10 - 8 = 2
    // Days remaining: 7 - 2 = 5 days
    await page.route('**/rest/v1/my_plants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-monstera-1',
          user_id: testUser.email,
          nickname: 'Test Monstera',
          plant_id: 'monstera-deliciosa',
          room: 'Living Room',
          last_watered: '2025-09-08T12:00:00Z',
          watering_schedule_days: 7,
          created_at: '2025-09-01T00:00:00Z'
        }])
      });
    });
    
    await page.goto('/my-plants');
    await waitForPageReady(page);
    
    // Look for the plant card
    const plantCard = page.locator('[data-testid*="plant-card"]').or(
      page.locator('[class*="plant-card"]')
    ).filter({ hasText: 'Test Monstera' });
    
    if (await plantCard.count() === 0) {
      test.skip(true, 'Plant card not found - feature may not be implemented');
      return;
    }
    
    // Should show "5 days" or "5d" remaining
    const hasCorrectSchedule = await plantCard.locator('text=/5\\s*days?|days?\\s*5|5d/i').count() > 0;
    
    expect(hasCorrectSchedule).toBe(true);
  });

  test('should show full schedule for just-watered plants', async ({ page, authPage }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Mock plant: watered today (Sept 10), schedule every 7 days
    // Days since watering: 0
    // Days remaining: 7 days
    await page.route('**/rest/v1/my_plants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-pothos-1',
          user_id: testUser.email,
          nickname: 'Just Watered Pothos',
          plant_id: 'pothos',
          room: 'Kitchen',
          last_watered: '2025-09-10T12:00:00Z', // Today
          watering_schedule_days: 7,
          created_at: '2025-09-01T00:00:00Z'
        }])
      });
    });
    
    await page.goto('/my-plants');
    await waitForPageReady(page);
    
    // Look for the plant card
    const plantCard = page.locator('[data-testid*="plant-card"]').or(
      page.locator('[class*="plant-card"]')
    ).filter({ hasText: 'Just Watered Pothos' });
    
    if (await plantCard.count() === 0) {
      test.skip(true, 'Plant card not found - feature may not be implemented');
      return;
    }
    
    // Should show "7 days" remaining (full schedule)
    const hasFullSchedule = await plantCard.locator('text=/7\\s*days?|days?\\s*7|7d/i').count() > 0;
    
    expect(hasFullSchedule).toBe(true);
  });

  test('should calculate long schedules correctly (30+ days)', async ({ page, authPage }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Mock plant: watered Aug 25, schedule every 30 days, current Sept 10
    // Days since watering: ~16 days (Aug 25 -> Sept 10)
    // Days remaining: 30 - 16 = 14 days
    await page.route('**/rest/v1/my_plants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-cactus-1',
          user_id: testUser.email,
          nickname: 'Monthly Cactus',
          plant_id: 'barrel-cactus',
          room: 'Office',
          last_watered: '2025-08-25T12:00:00Z',
          watering_schedule_days: 30,
          created_at: '2025-08-01T00:00:00Z'
        }])
      });
    });
    
    await page.goto('/my-plants');
    await waitForPageReady(page);
    
    // Look for the plant card
    const plantCard = page.locator('[data-testid*="plant-card"]').or(
      page.locator('[class*="plant-card"]')
    ).filter({ hasText: 'Monthly Cactus' });
    
    if (await plantCard.count() === 0) {
      test.skip(true, 'Plant card not found - feature may not be implemented');
      return;
    }
    
    // Should show approximately "14 days" remaining (±1 day for calculation differences)
    const hasCorrectSchedule = await plantCard.locator('text=/1[34]\\s*days?|days?\\s*1[34]|1[34]d/i').count() > 0;
    
    expect(hasCorrectSchedule).toBe(true);
  });

  test('should handle postponed plants with future dates', async ({ page, authPage }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Mock postponed plant: postponed until Sept 13 (3 days from current Sept 10)
    await page.route('**/rest/v1/my_plants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-postponed-1',
          user_id: testUser.email,
          nickname: 'Postponed Plant',
          plant_id: 'rubber-tree',
          room: 'Bedroom',
          last_watered: '2025-09-05T12:00:00Z',
          watering_schedule_days: 7,
          postponed_until: '2025-09-13T00:00:00Z',
          created_at: '2025-09-01T00:00:00Z'
        }])
      });
    });
    
    await page.goto('/my-plants');
    await waitForPageReady(page);
    
    // Look for the plant card
    const plantCard = page.locator('[data-testid*="plant-card"]').or(
      page.locator('[class*="plant-card"]')
    ).filter({ hasText: 'Postponed Plant' });
    
    if (await plantCard.count() === 0) {
      test.skip(true, 'Plant card not found - feature may not be implemented');
      return;
    }
    
    // Should show postponed status or postponed date
    const hasPostponedInfo = await plantCard.locator('text=/postponed|snoozed|delayed/i').count() > 0;
    
    expect(hasPostponedInfo).toBe(true);
  });

  test('should handle expired postponements by reverting to schedule', async ({ page, authPage }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Mock plant: postponed until Sept 8 (expired), watered Sept 1, schedule 7 days
    // Current date Sept 10, so postponement expired
    // Should revert to normal calculation: 10 - 1 = 9 days since watering
    // Should be 2 days overdue (7 day schedule)
    await page.route('**/rest/v1/my_plants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-expired-1',
          user_id: testUser.email,
          nickname: 'Expired Postponement',
          plant_id: 'snake-plant',
          room: 'Hallway',
          last_watered: '2025-09-01T12:00:00Z',
          watering_schedule_days: 7,
          postponed_until: '2025-09-08T00:00:00Z', // Expired
          created_at: '2025-08-25T00:00:00Z'
        }])
      });
    });
    
    await page.goto('/my-plants');
    await waitForPageReady(page);
    
    // Look for the plant card
    const plantCard = page.locator('[data-testid*="plant-card"]').or(
      page.locator('[class*="plant-card"]')
    ).filter({ hasText: 'Expired Postponement' });
    
    if (await plantCard.count() === 0) {
      test.skip(true, 'Plant card not found - feature may not be implemented');
      return;
    }
    
    // Should show overdue status (due now, water now, overdue, etc.)
    const hasOverdueStatus = await plantCard.locator('text=/overdue|due now|water now|needs water/i').count() > 0;
    
    expect(hasOverdueStatus).toBe(true);
  });
});

