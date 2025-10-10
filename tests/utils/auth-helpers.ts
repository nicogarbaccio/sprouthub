/**
 * Shared authentication helpers for Playwright tests
 * Phase 4: Improved with proper state-based waits (no arbitrary timeouts)
 */

export interface TestUser {
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Reliable authentication setup that works across all browsers
 * Uses state-based waits instead of arbitrary timeouts
 * 
 * @example
 * const testUser = getTestUser('my-test');
 * await setupAuthenticatedUser(page, authPage, testUser);
 */
export async function setupAuthenticatedUser(page: any, authPage: any, testUser: TestUser) {
  // Navigate to auth page
  await page.goto('/auth');
  await page.waitForLoadState('domcontentloaded');
  
  // Switch to sign-up form
  await authPage.switchToSignUp();
  await authPage.expectSignUpFormVisible();
  
  // Fill and submit sign-up form
  const userData = {
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    username: testUser.username || testUser.firstName.toLowerCase() + testUser.lastName.toLowerCase(),
    email: testUser.email,
    password: testUser.password,
    confirmPassword: testUser.confirmPassword || testUser.password
  };
  
  await authPage.fillSignUpForm(userData);
  await authPage.submitSignUp();
  
  // Wait for navigation after sign-up
  await page.waitForURL(/\/(my-plants|auth|$)/, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
  
  // Check if we need to sign in (common flow)
  const currentUrl = page.url();
  if (currentUrl.includes('/auth')) {
    // Switch to sign-in if still on auth page
    await authPage.switchToSignIn();
    await authPage.expectSignInFormVisible();
    
    // Fill and submit sign-in form
    await authPage.fillSignInForm(testUser.email, testUser.password);
    await authPage.submitSignIn();
    
    // Wait for navigation after sign-in
    await page.waitForURL(/\/(my-plants|$)/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
  }
  
  // Verify authentication by checking for user menu or add plant button
  const userMenu = page.getByTestId('user-menu');
  const addPlantButton = page.getByRole('button', { name: /add.*plant/i }).first();
  
  // Wait for either indicator of successful auth
  try {
    await Promise.race([
      userMenu.waitFor({ state: 'visible', timeout: 5000 }),
      addPlantButton.waitFor({ state: 'visible', timeout: 5000 })
    ]);
  } catch (error) {
    throw new Error('Authentication verification failed: No user menu or add plant button found');
  }
}

/**
 * Verify that authentication completed successfully
 * Returns object with authentication status
 * 
 * @example
 * const authState = await verifyAuthenticationState(page);
 * expect(authState.isAuthenticated).toBe(true);
 */
export async function verifyAuthenticationState(page: any) {
  // Navigate to home to check auth state
  await page.goto('/', { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for page to be ready
  await waitForPageReady(page);
  
  // Check for authenticated state (user menu or add plant button)
  const userMenu = page.getByTestId('user-menu');
  const addPlantButton = page.getByRole('button', { name: /add.*plant/i }).first();
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();
  
  // Wait a bit longer to ensure auth state is loaded
  await page.waitForTimeout(500);
  
  const hasUserMenu = await userMenu.isVisible({ timeout: 3000 }).catch(() => false);
  const hasAddPlantButton = await addPlantButton.isVisible({ timeout: 3000 }).catch(() => false);
  const hasSignInButton = await signInButton.isVisible({ timeout: 3000 }).catch(() => false);
  
  const isAuthenticated = hasUserMenu || hasAddPlantButton;
  const needsAuth = hasSignInButton && !isAuthenticated;
  
  console.log(`Auth state verified - Authenticated: ${isAuthenticated}, Needs auth: ${needsAuth}`);
  return { isAuthenticated, needsAuth, url: page.url() };
}

/**
 * Wait for page to reach stable state after navigation
 * Waits for DOM content loaded and any loading spinners to disappear
 * 
 * @example
 * await page.goto('/my-plants');
 * await waitForPageReady(page);
 */
export async function waitForPageReady(page: any) {
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for any loading spinners to disappear
  const spinner = page.locator('[data-testid*="loading"], [class*="skeleton"], [class*="spinner"]').first();
  const spinnerVisible = await spinner.isVisible({ timeout: 1000 }).catch(() => false);
  
  if (spinnerVisible) {
    await spinner.waitFor({ state: 'hidden', timeout: 5000 });
  }
}

/**
 * Sign out current user
 * 
 * @example
 * await signOut(page);
 */
export async function signOut(page: any) {
  const userMenu = page.getByTestId('user-menu');
  await userMenu.click();
  
  const signOutButton = page.getByRole('button', { name: /sign out|log out/i });
  await signOutButton.click();
  
  // Wait for redirect to auth page or home
  await page.waitForURL(/\/(auth|$)/, { timeout: 5000 });
}

/**
 * Check if user is currently authenticated
 * Quick check without navigation
 * 
 * @example
 * const isAuth = await isAuthenticated(page);
 * if (!isAuth) {
 *   await setupAuthenticatedUser(page, authPage, testUser);
 * }
 */
export async function isAuthenticated(page: any): Promise<boolean> {
  const userMenu = page.getByTestId('user-menu');
  return await userMenu.isVisible({ timeout: 2000 }).catch(() => false);
}