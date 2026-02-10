import { test, expect } from '@playwright/test';

// Reuse authenticated state from the setup project — no per-test login needed
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard — already authenticated via storageState
    await page.goto('/');
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

  test('should open Add Plant dialog from My Plants', async ({ page }) => {
    // Navigate to My Plants first
    await page.click('text=My Plants');
    await expect(page).toHaveURL(/\/my-plants/);
    await expect(page.getByTestId('my-plants-collection')).toBeVisible();

    // Click the Add New Plant button
    await page.getByTestId('add-plant-button').click();

    // Check if dialog opened
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Add New Plant/i })).toBeVisible();
  });
});

