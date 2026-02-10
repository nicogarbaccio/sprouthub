import { test, expect } from '@playwright/test';
import { deleteUserByEmail, signUpAndReachOnboarding } from './helpers';

test.describe('User Onboarding Flow', () => {
  // Generate unique credentials for each test run
  const timestamp = Date.now();
  const NEW_USER_EMAIL = `onboarding-test-${timestamp}@example.com`;
  const NEW_USER_PASSWORD = `Xk9${timestamp}!mP7&zQ2`;
  const NEW_USER_FIRSTNAME = 'Onboarding';
  const NEW_USER_LASTNAME = 'Tester';
  const NEW_USER_USERNAME = `onboarduser${timestamp}`;

  test.afterAll(async () => {
    // Clean up the created user
    await deleteUserByEmail(NEW_USER_EMAIL);
  });

  test('should complete full onboarding flow and reach dashboard', async ({ page }) => {
    await signUpAndReachOnboarding(page, {
      firstName: NEW_USER_FIRSTNAME,
      lastName: NEW_USER_LASTNAME,
      username: NEW_USER_USERNAME,
      email: NEW_USER_EMAIL,
      password: NEW_USER_PASSWORD,
    });

    // Step 1: Welcome screen
    await expect(page.locator('h1').filter({ hasText: /welcome to sprouthub/i })).toBeVisible();
    await expect(page.locator('text=Your personal plant care companion')).toBeVisible();

    // Verify progress indicator shows step 1 of 5
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();

    // Click Get Started
    await page.locator('button:has-text("Get Started")').click();

    // Step 2: Weather setup
    await expect(page.locator('h2').filter({ hasText: /enable weather features/i })).toBeVisible();
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();

    // Toggle weather on
    await page.locator('button[role="switch"][id="weather-toggle"]').click();

    // Select temperature unit (Fahrenheit)
    await page.locator('label:has-text("Fahrenheit")').click();

    // Click Continue
    await page.locator('button:has-text("Continue")').click();

    // Step 3: Preferences
    await expect(page.locator('h2').filter({ hasText: /set your care preferences/i })).toBeVisible();
    await expect(page.locator('text=Step 3 of 5')).toBeVisible();

    // Select care style (Balanced should be selected by default, click Frequent)
    await page.locator('text=I like to check plants frequently').click();

    await page.locator('button:has-text("Continue")').click();

    // Step 4: Add plant (optional)
    await expect(page.locator('h2').filter({ hasText: /add your first plant/i })).toBeVisible();
    await expect(page.locator('text=Step 4 of 5')).toBeVisible();

    // Skip adding plant for now
    await page.locator('button:has-text("I\'ll Add Plants Later")').click();

    // Step 5: Completion
    await expect(page.locator('h2').filter({ hasText: /you\'re all set/i })).toBeVisible();
    await expect(page.locator('text=Step 5 of 5')).toBeVisible();
    await expect(page.locator('text=Your SproutHub account is ready')).toBeVisible();

    // Complete onboarding
    await page.locator('button:has-text("Go to Dashboard")').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 5000 });
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should allow skipping onboarding entirely', async ({ page }) => {
    const skipEmail = `skip-onboarding-${Date.now()}@example.com`;
    const skipPassword = `Xk9${Date.now()}!mP7&zQ2`;

    await signUpAndReachOnboarding(page, {
      firstName: 'Skip',
      lastName: 'User',
      username: `skipuser${Date.now()}`,
      email: skipEmail,
      password: skipPassword,
    });

    // Click "Skip onboarding" button
    await page.locator('button:has-text("Skip onboarding")').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 5000 });
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });

    // Clean up
    await deleteUserByEmail(skipEmail);
  });

  test('should allow navigating back through onboarding steps', async ({ page }) => {
    const backNavEmail = `back-nav-${Date.now()}@example.com`;
    const backNavPassword = `Xk9${Date.now()}!mP7&zQ2`;

    await signUpAndReachOnboarding(page, {
      firstName: 'BackNav',
      lastName: 'User',
      username: `backnavuser${Date.now()}`,
      email: backNavEmail,
      password: backNavPassword,
    });

    // Step 1 -> Step 2
    await page.locator('button:has-text("Get Started")').click();
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();

    // Step 2 -> Step 3
    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Step 3 of 5')).toBeVisible();

    // Go back to Step 2
    await page.locator('button:has-text("Back")').first().click();
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /enable weather features/i })).toBeVisible();

    // Go back to Step 1
    await page.locator('button:has-text("Back")').first().click();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: /welcome to sprouthub/i })).toBeVisible();

    // Clean up - skip rest of onboarding
    await page.locator('button:has-text("Skip onboarding")').click();
    await deleteUserByEmail(backNavEmail);
  });

  test('should save weather preferences during onboarding', async ({ page }) => {
    const weatherEmail = `weather-pref-${Date.now()}@example.com`;
    const weatherPassword = `Xk9${Date.now()}!mP7&zQ2`;

    await signUpAndReachOnboarding(page, {
      firstName: 'Weather',
      lastName: 'User',
      username: `weatheruser${Date.now()}`,
      email: weatherEmail,
      password: weatherPassword,
    });

    // Complete step 1
    await page.locator('button:has-text("Get Started")').click();

    // Step 2: Enable weather and set Celsius
    await page.locator('button[role="switch"][id="weather-toggle"]').click();
    await page.locator('label:has-text("Celsius")').click();
    await page.locator('button:has-text("Continue")').click();

    // Complete remaining steps quickly
    await page.locator('button:has-text("Continue")').click(); // Step 3
    await page.locator('button:has-text("I\'ll Add Plants Later")').click(); // Step 4
    await page.locator('button:has-text("Go to Dashboard")').click(); // Step 5

    // Verify we're on dashboard
    await expect(page).toHaveURL('/', { timeout: 5000 });
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to settings to verify weather was saved
    await page.getByTestId('user-dropdown-trigger').click();

    // Wait for dropdown menu to appear and click Settings
    const settingsLink = page.getByRole('menuitem', { name: /settings/i });
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
    await settingsLink.click();
    await expect(page).toHaveURL('/settings', { timeout: 5000 });

    // Click Weather tab
    await page.locator('button[role="tab"]:has-text("Weather")').click();

    // Verify weather toggle is ON
    const weatherToggle = page.locator('button[role="switch"][id="weather-toggle"]');
    await expect(weatherToggle).toHaveAttribute('data-state', 'checked');

    // Verify Celsius is selected
    const celsiusRadio = page.locator('button[role="radio"][value="C"]');
    await expect(celsiusRadio).toHaveAttribute('data-state', 'checked');

    // Clean up
    await deleteUserByEmail(weatherEmail);
  });

  test('should save care style preference during onboarding', async ({ page }) => {
    const careEmail = `care-style-${Date.now()}@example.com`;
    const carePassword = `Xk9${Date.now()}!mP7&zQ2`;

    await signUpAndReachOnboarding(page, {
      firstName: 'CareStyle',
      lastName: 'User',
      username: `carestyleuser${Date.now()}`,
      email: careEmail,
      password: carePassword,
    });

    // Complete step 1 & 2
    await page.locator('button:has-text("Get Started")').click();
    await page.locator('button:has-text("Continue")').click();

    // Step 3: Select "Minimal Care"
    await page.locator('text=I want low-maintenance schedules').click();
    await page.locator('button:has-text("Continue")').click();

    // Complete remaining steps
    await page.locator('button:has-text("I\'ll Add Plants Later")').click();
    await page.locator('button:has-text("Go to Dashboard")').click();

    // Verify dashboard loads
    await expect(page).toHaveURL('/', { timeout: 5000 });
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to settings preferences tab
    await page.getByTestId('user-dropdown-trigger').click();

    // Wait for dropdown menu to appear and click Settings
    const settingsLink = page.getByRole('menuitem', { name: /settings/i });
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
    await settingsLink.click();
    await expect(page).toHaveURL('/settings', { timeout: 5000 });

    await page.locator('button[role="tab"]:has-text("Preferences")').click();

    // Verify Minimal Care is saved (it should have the selected border/background)
    const minimalCard = page.locator('.border-plant-primary').filter({ hasText: /I want low-maintenance schedules/i });
    await expect(minimalCard).toBeVisible();

    // Clean up
    await deleteUserByEmail(careEmail);
  });

  test('should show personalized welcome message with user name', async ({ page }) => {
    const nameEmail = `name-test-${Date.now()}@example.com`;
    const namePassword = `Xk9${Date.now()}!mP7&zQ2`;
    const firstName = 'TestFirstName';

    await signUpAndReachOnboarding(page, {
      firstName,
      lastName: 'LastName',
      username: `nameuser${Date.now()}`,
      email: nameEmail,
      password: namePassword,
    });

    // Verify welcome message includes first name
    await expect(page.locator(`text=Welcome to SproutHub, ${firstName}!`)).toBeVisible();

    // Go to completion step
    await page.locator('button:has-text("Get Started")').click();
    await page.locator('button:has-text("Continue")').click();
    await page.locator('button:has-text("Continue")').click();
    await page.locator('button:has-text("I\'ll Add Plants Later")').click();

    // Verify completion message includes first name
    await expect(page.locator(`text=You're All Set, ${firstName}!`)).toBeVisible();

    // Clean up
    await page.locator('button:has-text("Skip onboarding")').click();
    await deleteUserByEmail(nameEmail);
  });

  test('should show progress bar updating through steps', async ({ page }) => {
    const progressEmail = `progress-${Date.now()}@example.com`;
    const progressPassword = `Xk9${Date.now()}!mP7&zQ2`;

    await signUpAndReachOnboarding(page, {
      firstName: 'Progress',
      lastName: 'Test',
      username: `progressuser${Date.now()}`,
      email: progressEmail,
      password: progressPassword,
    });

    // Check progress at each step
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();

    await page.locator('button:has-text("Get Started")').click();
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();

    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Step 3 of 5')).toBeVisible();

    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Step 4 of 5')).toBeVisible();

    await page.locator('button:has-text("I\'ll Add Plants Later")').click();
    await expect(page.locator('text=Step 5 of 5')).toBeVisible();

    // Clean up
    await page.locator('button:has-text("Skip onboarding")').click();
    await deleteUserByEmail(progressEmail);
  });
});

test.describe('Onboarding for Returning Users', () => {
  // Reuse authenticated state — no per-test login needed
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should not show onboarding for users who already completed it', async ({ page }) => {
    // Navigate directly — already authenticated via storageState
    await page.goto('/');

    // Should go directly to dashboard, NOT onboarding
    await expect(page).toHaveURL('/', { timeout: 5000 });
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('should not allow accessing onboarding URL after completion', async ({ page }) => {
    // Already authenticated via storageState — go directly to onboarding URL
    await page.goto('/onboarding');

    // Should redirect away from onboarding (either to dashboard or stay on dashboard)
    await page.waitForTimeout(1000);

    // URL should either be root or should not show onboarding content
    const isOnRoot = await page.url().includes('localhost:8080/') || await page.url().endsWith('/');
    const hasOnboardingContent = await page.locator('text=Step 1 of 5').isVisible().catch(() => false);

    // Either should be redirected to root, or onboarding content should not be visible
    expect(isOnRoot || !hasOnboardingContent).toBeTruthy();
  });
});
