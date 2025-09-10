import { test, expect, testUsers } from '../../fixtures/test-fixtures';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display auth forms correctly', async ({ authPage }) => {
    // Test sign in form
    await expect(authPage.signInEmailInput).toBeVisible();
    await expect(authPage.signInPasswordInput).toBeVisible();
    await expect(authPage.signInButton).toBeVisible();
  });

  test('should handle invalid login', async ({ authPage }) => {
    await authPage.fillSignInForm(
      testUsers.invalidUser.email,
      testUsers.invalidUser.password
    );
    await authPage.submitSignIn();
    
    // Should stay on auth page
    await expect(authPage.page).toHaveURL(/.*\/auth/);
  });

  test('should switch between sign in and sign up tabs', async ({ authPage }) => {
    // Start on sign in tab
    await expect(authPage.signInEmailInput).toBeVisible();
    
    // Switch to sign up
    await authPage.switchToSignUp();
    await expect(authPage.signUpEmailInput).toBeVisible();
    
    // Switch back to sign in
    await authPage.switchToSignIn();
    await expect(authPage.signInEmailInput).toBeVisible();
  });

  test('should display sign up form correctly', async ({ authPage }) => {
    await authPage.switchToSignUp();
    
    await expect(authPage.firstNameInput).toBeVisible();
    await expect(authPage.lastNameInput).toBeVisible();
    await expect(authPage.usernameInput).toBeVisible();
    await expect(authPage.signUpEmailInput).toBeVisible();
    await expect(authPage.signUpPasswordInput).toBeVisible();
    await expect(authPage.confirmPasswordInput).toBeVisible();
    await expect(authPage.signUpButton).toBeVisible();
  });
});
