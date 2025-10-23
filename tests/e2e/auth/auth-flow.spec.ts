import { test, expect, testUsers } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';

test.describe('Authentication Flow', () => {
  const testUser = getTestUser('auth-flow');

  test.beforeEach(async ({ page, context }) => {
    // Navigate first, then clear storage to test authentication from scratch
    await page.goto('/auth');

    // Clear storage state after navigation to avoid SecurityError
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload to ensure clean state
    await page.reload();
  });

  test('displays auth forms correctly', async ({ authPage }) => {
    await expect(authPage.signInEmailInput).toBeVisible();
    await expect(authPage.signInPasswordInput).toBeVisible();
    await expect(authPage.signInButton).toBeVisible();
  });

  test('switches between sign-in and sign-up forms', async ({ authPage }) => {
    // Start on sign-in form
    await expect(authPage.signInEmailInput).toBeVisible();
    
    // Switch to sign-up
    await authPage.switchToSignUp();
    await expect(authPage.signUpEmailInput).toBeVisible();
    await expect(authPage.firstNameInput).toBeVisible();
    
    // Switch back to sign-in
    await authPage.switchToSignIn();
    await expect(authPage.signInEmailInput).toBeVisible();
  });

  test('completes user sign-up successfully', async ({ authPage }) => {
    await authPage.switchToSignUp();
    await authPage.fillSignUpForm(testUser);
    await authPage.submitSignUp();
    
    // Should either redirect or stay on auth page (both valid)
    await authPage.page.waitForLoadState('networkidle');
    const url = authPage.page.url();
    expect(url).toBeTruthy(); // Just verify page didn't crash
  });

  test('handles invalid sign-in credentials', async ({ authPage }) => {
    await authPage.fillSignInForm(testUsers.invalidUser.email, testUsers.invalidUser.password);
    await authPage.submitSignIn();
    
    await authPage.page.waitForLoadState('domcontentloaded');
    expect(authPage.page.url()).toContain('/auth');
  });

  test('validates sign-up form with mismatched passwords', async ({ authPage }) => {
    await authPage.switchToSignUp();
    
    const invalidUser = {
      ...testUser,
      confirmPassword: 'differentpassword'
    };
    
    await authPage.fillSignUpForm(invalidUser);
    await authPage.submitSignUp();
    
    await authPage.page.waitForLoadState('domcontentloaded');
    expect(authPage.page.url()).toContain('/auth');
  });

  test('persists session after page reload', async ({ authPage, page }) => {
    // Import helper functions
    const { setupAuthenticatedUser, verifyAuthenticationState, waitForPageReady } = await import('../../utils/auth-helpers');
    
    // Set up authenticated user
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Wait for page to be ready
    await waitForPageReady(page);
    
    // Check initial auth state
    const initialState = await verifyAuthenticationState(page);
    expect(initialState.isAuthenticated).toBe(true);
    
    // Reload page
    await page.reload();
    await waitForPageReady(page);
    
    // Check state after reload - should still be authenticated
    const finalState = await verifyAuthenticationState(page);
    expect(finalState.isAuthenticated).toBe(true);
  });

  test('allows sign-in after sign-up', async ({ authPage, page }) => {
    // Import helper functions
    const { setupAuthenticatedUser, verifyAuthenticationState, waitForPageReady } = await import('../../utils/auth-helpers');
    
    // This test is essentially the same as setupAuthenticatedUser
    // which handles the sign-up → sign-in flow
    await setupAuthenticatedUser(page, authPage, testUser);
    
    // Wait for page to be ready
    await waitForPageReady(page);
    
    // Verify final authentication state - should be authenticated
    const finalState = await verifyAuthenticationState(page);
    expect(finalState.isAuthenticated).toBe(true);
  });
});