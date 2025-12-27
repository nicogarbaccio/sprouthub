import { test, expect } from '@playwright/test';
import { deleteUserByEmail } from './helpers';

// Use credentials from environment variables or .env.test
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display sign in form by default', async ({ page }) => {
    await expect(page.getByTestId('sign-in-email')).toBeVisible();
    await expect(page.getByTestId('sign-in-password')).toBeVisible();
    await expect(page.getByTestId('sign-in-button')).toBeVisible();
  });

  test('should switch between sign in and sign up tabs', async ({ page }) => {
    // Click Sign Up tab
    await page.getByTestId('sign-up-trigger').click();
    
    // Verify Sign Up button is visible and Sign In button is hidden
    await expect(page.getByTestId('sign-up-button')).toBeVisible();
    await expect(page.getByTestId('sign-in-button')).not.toBeVisible();

    // Click Sign In tab
    await page.getByTestId('sign-in-trigger').click();

    // Verify Sign In button is visible again
    await expect(page.getByTestId('sign-in-button')).toBeVisible();
    await expect(page.getByTestId('sign-up-button')).not.toBeVisible();
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.getByTestId('sign-in-email').fill('invalid@example.com');
    await page.getByTestId('sign-in-password').fill('wrongpassword');
    await page.getByTestId('sign-in-button').click();

    // Expect an error toast or message
    // Common Supabase error: "Invalid login credentials"
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // Skip if test credentials are not provided
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials (TEST_USER_EMAIL, TEST_USER_PASSWORD) are not set');
      return;
    }

    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);
    await page.getByTestId('sign-in-button').click();

    // Verify redirection to dashboard
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Sign Up Flow', () => {
  const NEW_USER_EMAIL = `test-user-${Date.now()}@example.com`;
  // Use a strong, random password that won't be flagged as weak by Supabase
  const NEW_USER_PASSWORD = `Xk9${Date.now()}!mP7&zQ2`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByTestId('sign-up-trigger').click();
  });

  test.afterAll(async () => {
    // Clean up the created user
    await deleteUserByEmail(NEW_USER_EMAIL);
  });

  test('should validate password mismatch', async ({ page }) => {
    await page.getByTestId('first-name-input').fill('Test');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(`user${Date.now()}`);
    await page.getByTestId('sign-up-email').fill(`mismatch-${Date.now()}@example.com`);

    // Enter mismatched passwords
    await page.getByTestId('signup-password').fill('Password123');
    await page.getByTestId('confirmPassword').fill('Password456');

    await page.getByTestId('sign-up-button').click();

    // Check for validation error
    await expect(page.locator('text=Passwords don\'t match')).toBeVisible();
  });

  test('should successfully sign up a new user', async ({ page }) => {
    // Fill in all sign-up form fields
    await page.getByTestId('first-name-input').fill('Test');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(`testuser${Date.now()}`);
    await page.getByTestId('sign-up-email').fill(NEW_USER_EMAIL);

    // Enter matching passwords
    await page.getByTestId('signup-password').fill(NEW_USER_PASSWORD);
    await page.getByTestId('confirmPassword').fill(NEW_USER_PASSWORD);

    // Submit the sign-up form
    await page.getByTestId('sign-up-button').click();

    // Verify successful sign-up by checking for success toast
    await expect(page.locator('text=Account Created!')).toBeVisible({ timeout: 10000 });
  });

});
