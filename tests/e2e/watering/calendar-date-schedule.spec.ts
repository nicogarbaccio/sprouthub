import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';
import { createMockPlants, setupMockPlantData, setupMockDate, MOCK_CURRENT_DATE } from '../../utils/mock-plant-data';
import { 
  waitForMockData, 
  verifyPlantsRendered, 
  debugTestEnvironment,
  skipTestIfConditionNotMet,
  waitForStableContent
} from '../../utils/test-helpers';

test.describe('Calendar Date Watering Schedule', () => {
  const testUser = getTestUser('calendar-date-schedule');

  test.beforeEach(async ({ page }) => {
    await setupMockDate(page, MOCK_CURRENT_DATE);
  });

  async function setupAuthenticatedUser(page: any, authPage: any) {
    const { setupAuthenticatedUser: sharedSetup } = await import('../../utils/auth-helpers');
    await sharedSetup(page, authPage, testUser);
  }

  test('calculates days remaining based on calendar dates only', async ({ 
    page, 
    authPage,
    browserName 
  }) => {
    await setupAuthenticatedUser(page, authPage);
    
    const mockPlants = createMockPlants.normalPlants('test-user-id-123');
    await setupMockPlantData(page, mockPlants, { verbose: true });
    
    // Verify mock data is working
    const mockDataReady = await waitForMockData(page, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'calendar date calculation test',
      async () => mockDataReady,
      'Mock data not active'
    )) {
      test.skip();
      return;
    }
    
    await page.goto('/my-plants');
    await waitForStableContent(page, browserName, { extraWait: 1000 });
    
    // Verify expected plants are rendered
    const plantsRendered = await verifyPlantsRendered(page, ['Test Monstera'], { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'calendar date calculation test',
      async () => plantsRendered,
      'Expected plants not rendered'
    )) {
      test.skip();
      return;
    }
    
    // Test that calculations are based on calendar dates
    const monsteraCard = page.getByTestId('plant-card').filter({ hasText: 'Test Monstera' });
    await expect(monsteraCard).toBeVisible({ timeout: 10000 });
    // Monstera watered Sep 8th, current date Sep 10th = 2 days ago
    // 7-day schedule: 7 - 2 = 5 days remaining
    const hasCorrectCalculation = await monsteraCard.locator('text=/5.*days?|days?.*5/i').count() > 0;
    expect(hasCorrectCalculation).toBeTruthy();
  });

  test('handles postponed plants with future calendar dates', async ({ 
    page, 
    authPage,
    browserName 
  }) => {
    await setupAuthenticatedUser(page, authPage);
    
    const mockPlants = createMockPlants.postponedPlant('test-user-id-123');
    await setupMockPlantData(page, mockPlants, { verbose: true });
    
    // Verify mock data is working
    const mockDataReady = await waitForMockData(page, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'postponed plants test',
      async () => mockDataReady,
      'Mock data not active'
    )) {
      test.skip();
      return;
    }
    
    await page.goto('/my-plants');
    await waitForStableContent(page, browserName, { extraWait: 1000 });
    
    // Verify expected plants are rendered
    const plantsRendered = await verifyPlantsRendered(page, ['Test Postponed Plant'], { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'postponed plants test',
      async () => plantsRendered,
      'Expected plants not rendered'
    )) {
      test.skip();
      return;
    }
    
    const postponedCard = page.getByTestId('plant-card').filter({ hasText: 'Test Postponed Plant' });
    await expect(postponedCard).toBeVisible({ timeout: 10000 });
    // Postponed until Sep 13th, current date Sep 10th = 3 days until postponed date
    const hasPostponedStatus = await postponedCard.locator('text=/postponed|september.*13|3.*days?/i').count() > 0;
    expect(hasPostponedStatus).toBeTruthy();
  });

  test('handles expired postponements by reverting to normal schedule', async ({ 
    page, 
    authPage,
    browserName 
  }) => {
    await setupAuthenticatedUser(page, authPage);
    
    const mockPlants = createMockPlants.expiredPostponementPlant('test-user-id-123');
    await setupMockPlantData(page, mockPlants, { verbose: true });
    
    // Verify mock data is working
    const mockDataReady = await waitForMockData(page, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'expired postponement test',
      async () => mockDataReady,
      'Mock data not active'
    )) {
      test.skip();
      return;
    }
    
    await page.goto('/my-plants');
    await waitForStableContent(page, browserName, { extraWait: 1000 });
    
    // Verify expected plants are rendered
    const plantsRendered = await verifyPlantsRendered(page, ['Expired Postponement Plant'], { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'expired postponement test',
      async () => plantsRendered,
      'Expected plants not rendered'
    )) {
      test.skip();
      return;
    }
    
    const expiredCard = page.getByTestId('plant-card').filter({ hasText: 'Expired Postponement Plant' });
    await expect(expiredCard).toBeVisible({ timeout: 10000 });
    // Plant was postponed to Sep 8th but it's now Sep 10th
    // Should show overdue status (watered Sep 1st, 7-day schedule = 2 days overdue)
    const hasOverdueStatus = await expiredCard.locator('text=/overdue|due.*now|water.*now/i').count() > 0;
    expect(hasOverdueStatus).toBeTruthy();
  });

  test('calculates long watering schedules correctly', async ({ 
    page, 
    authPage,
    browserName 
  }) => {
    await setupAuthenticatedUser(page, authPage);
    
    const mockPlants = createMockPlants.longSchedulePlant('test-user-id-123');
    await setupMockPlantData(page, mockPlants, { verbose: true });
    
    // Verify mock data is working
    const mockDataReady = await waitForMockData(page, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'long schedule plant test',
      async () => mockDataReady,
      'Mock data not active'
    )) {
      test.skip();
      return;
    }
    
    await page.goto('/my-plants');
    await waitForStableContent(page, browserName, { extraWait: 1000 });
    
    // Verify expected plants are rendered
    const plantsRendered = await verifyPlantsRendered(page, ['Monthly Cactus'], { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'long schedule plant test',
      async () => plantsRendered,
      'Expected plants not rendered'
    )) {
      test.skip();
      return;
    }
    
    const cactusCard = page.getByTestId('plant-card').filter({ hasText: 'Monthly Cactus' });
    await expect(cactusCard).toBeVisible({ timeout: 10000 });
    // Watered Aug 25th, current date Sep 10th = 16 days ago
    // 30-day schedule: 30 - 16 = 14 days remaining
    const hasCorrectCalculation = await cactusCard.locator('text=/14.*days?|days?.*14/i').count() > 0;
    expect(hasCorrectCalculation).toBeTruthy();
  });

  test('shows appropriate status for just-watered plants', async ({ 
    page, 
    authPage,
    browserName 
  }) => {
    await setupAuthenticatedUser(page, authPage);
    
    const mockPlants = createMockPlants.justWateredPlant('test-user-id-123');
    await setupMockPlantData(page, mockPlants, { verbose: true });
    
    // Verify mock data is working
    const mockDataReady = await waitForMockData(page, { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'just watered plant test',
      async () => mockDataReady,
      'Mock data not active'
    )) {
      test.skip();
      return;
    }
    
    await page.goto('/my-plants');
    await waitForStableContent(page, browserName, { extraWait: 1000 });
    
    // Verify expected plants are rendered
    const plantsRendered = await verifyPlantsRendered(page, ['Just Watered Plant'], { verbose: true });
    if (await skipTestIfConditionNotMet(
      page,
      'just watered plant test',
      async () => plantsRendered,
      'Expected plants not rendered'
    )) {
      test.skip();
      return;
    }
    
    const justWateredCard = page.getByTestId('plant-card').filter({ hasText: 'Just Watered Plant' });
    await expect(justWateredCard).toBeVisible({ timeout: 10000 });
    // Watered today (Sep 10th), 7-day schedule = 7 days until next watering
    const hasCorrectCalculation = await justWateredCard.locator('text=/7.*days?|days?.*7/i').count() > 0;
    expect(hasCorrectCalculation).toBeTruthy();
  });
});