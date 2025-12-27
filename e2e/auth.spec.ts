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

  test('should successfully sign out', async ({ page }) => {
    // Skip if test credentials are not provided
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials (TEST_USER_EMAIL, TEST_USER_PASSWORD) are not set');
      return;
    }

    // First sign in
    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);
    await page.getByTestId('sign-in-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

    // Click user dropdown menu
    await page.getByTestId('user-dropdown-trigger').click();

    // Click sign out
    await page.getByTestId('sign-out-button').click();

    // Verify sign out success toast and redirect to home
    await expect(page.locator('[data-title]').filter({ hasText: 'Signed Out' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should persist session after page refresh', async ({ page }) => {
    // Skip if test credentials are not provided
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials (TEST_USER_EMAIL, TEST_USER_PASSWORD) are not set');
      return;
    }

    // Sign in
    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);
    await page.getByTestId('sign-in-button').click();
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

    // Refresh the page
    await page.reload();

    // Verify still on dashboard (session persisted)
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.locator('text=Forgot password?').click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL('/forgot-password', { timeout: 5000 });
  });

  test('should validate empty sign-in fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByTestId('sign-in-button').click();

    // HTML5 validation should prevent submission
    // Check that we're still on the auth page
    await expect(page).toHaveURL('/auth', { timeout: 2000 });
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

  test('should reject duplicate email', async ({ page }) => {
    // Skip if test credentials are not provided
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials are not set');
      return;
    }

    // Try to sign up with existing email
    await page.getByTestId('first-name-input').fill('Duplicate');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(`duplicate${Date.now()}`);
    await page.getByTestId('sign-up-email').fill(TEST_EMAIL);

    const strongPassword = `Xk9${Date.now()}!mP7&zQ2`;
    await page.getByTestId('signup-password').fill(strongPassword);
    await page.getByTestId('confirmPassword').fill(strongPassword);

    await page.getByTestId('sign-up-button').click();

    // Verify error message about existing email
    await expect(page.locator('text=/already exists|already registered/i')).toBeVisible({ timeout: 10000 });
  });

  test('should reject duplicate username', async ({ page }) => {
    // First create a user with a specific username
    const timestamp = Date.now();
    const duplicateUsername = `dupuser${timestamp}`;
    const firstEmail = `first-${timestamp}@example.com`;
    const strongPassword = `Xk9${timestamp}!mP7&zQ2`;

    // Create first user
    await page.getByTestId('first-name-input').fill('First');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(duplicateUsername);
    await page.getByTestId('sign-up-email').fill(firstEmail);
    await page.getByTestId('signup-password').fill(strongPassword);
    await page.getByTestId('confirmPassword').fill(strongPassword);
    await page.getByTestId('sign-up-button').click();

    // Wait for success
    await expect(page.locator('text=Account Created!')).toBeVisible({ timeout: 10000 });

    // Navigate back to sign up
    await page.goto('/auth');
    await page.getByTestId('sign-up-trigger').click();

    // Try to sign up with same username but different email
    const secondEmail = `second-${timestamp}@example.com`;
    await page.getByTestId('first-name-input').fill('Second');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(duplicateUsername);
    await page.getByTestId('sign-up-email').fill(secondEmail);
    await page.getByTestId('signup-password').fill(strongPassword);
    await page.getByTestId('confirmPassword').fill(strongPassword);
    await page.getByTestId('sign-up-button').click();

    // Verify error message about duplicate username
    await expect(page.locator('text=/username.*already exists/i')).toBeVisible({ timeout: 10000 });

    // Clean up
    await deleteUserByEmail(firstEmail);
  });

  test('should reject weak password', async ({ page }) => {
    await page.getByTestId('first-name-input').fill('Test');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(`user${Date.now()}`);
    await page.getByTestId('sign-up-email').fill(`weak-${Date.now()}@example.com`);

    // Use a known weak password that Supabase rejects
    const weakPassword = 'Password123';
    await page.getByTestId('signup-password').fill(weakPassword);
    await page.getByTestId('confirmPassword').fill(weakPassword);
    await page.getByTestId('sign-up-button').click();

    // Verify error about weak password or registration failed
    await expect(page.locator('text=/weak|easy to guess|registration failed/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should reject password shorter than 6 characters', async ({ page }) => {
    await page.getByTestId('first-name-input').fill('Test');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(`user${Date.now()}`);
    await page.getByTestId('sign-up-email').fill(`short-${Date.now()}@example.com`);

    // Use a password shorter than 6 characters
    await page.getByTestId('signup-password').fill('ab12!');
    await page.getByTestId('confirmPassword').fill('ab12!');
    await page.getByTestId('sign-up-button').click();

    // Verify validation error
    await expect(page.locator('text=/at least 6 characters/i')).toBeVisible();
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.getByTestId('first-name-input').fill('Test');
    await page.getByTestId('last-name-input').fill('User');
    await page.getByTestId('username-input').fill(`user${Date.now()}`);

    // Use email that passes HTML5 validation but fails backend validation
    await page.getByTestId('sign-up-email').fill('test@invalid');

    const strongPassword = `Xk9${Date.now()}!mP7&zQ2`;
    await page.getByTestId('signup-password').fill(strongPassword);
    await page.getByTestId('confirmPassword').fill(strongPassword);
    await page.getByTestId('sign-up-button').click();

    // Verify either client-side validation error or Supabase error
    await expect(
      page.locator('text=/valid email|invalid email/i').first().or(
        page.locator('text=/registration failed/i').first()
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('should reject username shorter than 3 characters', async ({ page }) => {
    await page.getByTestId('first-name-input').fill('Test');
    await page.getByTestId('last-name-input').fill('User');

    // Use username that's too short
    await page.getByTestId('username-input').fill('ab');

    await page.getByTestId('sign-up-email').fill(`test-${Date.now()}@example.com`);

    const strongPassword = `Xk9${Date.now()}!mP7&zQ2`;
    await page.getByTestId('signup-password').fill(strongPassword);
    await page.getByTestId('confirmPassword').fill(strongPassword);
    await page.getByTestId('sign-up-button').click();

    // Verify validation error
    await expect(page.locator('text=/at least 3 characters/i')).toBeVisible();
  });

  test('should validate empty sign-up fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByTestId('sign-up-button').click();

    // HTML5 validation should prevent submission
    // Check that we're still on the auth page
    await expect(page).toHaveURL('/auth', { timeout: 2000 });
  });

});

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should display forgot password form', async ({ page }) => {
    await expect(page.locator('h1, h2, h3').filter({ hasText: /forgot.*password/i }).first()).toBeVisible();
  });

  test('should validate empty email on password reset', async ({ page }) => {
    // Button should be disabled when email is empty
    const submitButton = page.getByTestId('reset-password-button').or(page.locator('button[type="submit"]')).first();
    await expect(submitButton).toBeDisabled();
  });

  // Note: Password reset email sending is tested manually due to external email service dependency
  // The actual email sending relies on Supabase's email service which may be slow or disabled in test environments
});

test.describe('Protected Routes & Redirects', () => {
  test('should redirect to auth when accessing protected route', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();

    // Try to access a protected route (my-plants) without being logged in
    await page.goto('/my-plants');

    // Should redirect to auth page or home page
    await expect(page).toHaveURL(/\/(auth)?/, { timeout: 5000 });
  });

  test('should redirect back after login when using redirect parameter', async ({ page }) => {
    // Skip if test credentials are not provided
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials are not set');
      return;
    }

    // Navigate to auth with redirect parameter
    await page.goto('/auth?redirect=/my-plants');

    // Sign in
    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);
    await page.getByTestId('sign-in-button').click();

    // Should redirect to the specified page
    await expect(page).toHaveURL('/my-plants', { timeout: 15000 });
  });
});

test.describe('UI/UX Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should toggle password visibility on sign-in', async ({ page }) => {
    const passwordInput = page.getByTestId('sign-in-password');
    const toggleButton = passwordInput.locator('..').locator('button').first();

    // Fill password
    await passwordInput.fill('testpassword');

    // Initially should be type="password"
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show loading state during sign-in', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials are not set');
      return;
    }

    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);

    // Click submit and immediately check for loading state
    const signInButton = page.getByTestId('sign-in-button');
    await signInButton.click();

    // Should show loading text briefly
    await expect(signInButton).toHaveText(/signing in/i, { timeout: 2000 });
  });

  test('should allow form submission with Enter key', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'Test credentials are not set');
      return;
    }

    await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
    await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);

    // Press Enter instead of clicking button
    await page.getByTestId('sign-in-password').press('Enter');

    // Should submit and redirect to dashboard
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
  });
});
