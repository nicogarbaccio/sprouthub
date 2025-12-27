import { test, expect } from '@playwright/test';

// Use credentials from environment variables or .env.test
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Dashboard and Navigation', () => {
  // Skip if test credentials are not provided
  test.beforeEach(async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials are not set');
      return;
    }

    // Login before each test
    await page.goto('/auth');
    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);
    await page.getByTestId('sign-in-button').click();
    
    // Wait for dashboard
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('should display dashboard components', async ({ page }) => {
    // Verify key dashboard elements
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByTestId('todays-tasks-card')).toBeVisible();
    await expect(page.getByTestId('recent-activity-card')).toBeVisible();
    await expect(page.getByTestId('plant-health-insights-card')).toBeVisible();
  });

  test('should navigate to My Plants page', async ({ page }) => {
    // Click on "View All Plants" or use navigation
    // Searching for navigation elements:
    // Navigation component usually has links. 
    // Let's check if there is a 'My Plants' link in the navigation
    // We didn't explicitly check Navigation.tsx for testIds but we can try generic text selector first
    
    // There is "View All Plants" link in Quick Actions
    // Or we can use the navigation bar
    // Let's use the explicit URL navigation to be robust if navigation UI is tricky
    // But testing the click is better.
    // Assuming "My Plants" text is in the nav bar.
    await page.click('text=My Plants');
    
    // Verify URL
    await expect(page).toHaveURL(/\/my-plants/);
    
    // Verify My Plants page content
    // MyPlantsCollection.tsx has data-testid="my-plants-collection" and "collection-header"
    await expect(page.getByTestId('my-plants-collection')).toBeVisible();
    await expect(page.getByTestId('collection-header')).toBeVisible();
  });

  test('should open Add Plant dialog', async ({ page }) => {
    // Use the Floating Action Button which has data-testid="floating-action-button"
    await page.getByTestId('floating-action-button').click();

    // Check if dialog opened
    // AddPlantDialog has a title "Add New Plant"
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add New Plant' })).toBeVisible();
  });
});

