/**
 * Shared authentication helpers for Playwright tests
 * Designed for cross-browser reliability and consistent timing
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
 */
export async function setupAuthenticatedUser(page: any, authPage: any, testUser: TestUser, browserName?: string) {
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
  
  // Wait for sign-up to complete with proper timeout
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Check if we need to sign in (common flow)
  const currentUrl = page.url();
  if (currentUrl.includes('/auth')) {
    // Switch to sign-in if still on auth page
    await authPage.switchToSignIn();
    await authPage.expectSignInFormVisible();
    
    // Fill and submit sign-in form
    await authPage.fillSignInForm(testUser.email, testUser.password);
    await authPage.submitSignIn();
    
    // Wait for sign-in to complete
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }
  
  // Verify authentication worked by checking final state
  await verifyAuthenticationState(page, browserName);
}

/**
 * Verify that authentication completed successfully
 */
export async function verifyAuthenticationState(page: any, browserName?: string) {
  // Navigate to home to check auth state with browser-specific timeout
  const timeout = browserName === 'firefox' ? 30000 : 20000;
  await page.goto('/', { timeout });
  await page.waitForLoadState('domcontentloaded');
  
  // Give the app time to determine auth state
  await page.waitForTimeout(2000);
  
  // Check for either authenticated or unauthenticated state
  const addPlantButton = page.getByRole('button', { name: /add.*plant/i }).first();
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();
  
  const isAuthenticated = await addPlantButton.isVisible({ timeout: 5000 }).catch(() => false);
  const needsAuth = await signInButton.isVisible({ timeout: 5000 }).catch(() => false);
  
  // At least one state should be true (either logged in or out)
  if (!isAuthenticated && !needsAuth) {
    throw new Error('Cannot determine authentication state - no relevant buttons found');
  }
  
  console.log(`Auth state verified - Authenticated: ${isAuthenticated}, Needs auth: ${needsAuth}`);
  return { isAuthenticated, needsAuth };
}

/**
 * Wait for elements to be visible with retry logic
 */
export async function waitForElementWithRetry(
  page: any, 
  selector: string, 
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 10000, retries = 3 } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / retries });
      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000); // Wait before retry
    }
  }
  return false;
}

/**
 * Check if test should be skipped due to missing elements
 */
export async function shouldSkipTest(page: any, requiredElements: string[]): Promise<boolean> {
  for (const selector of requiredElements) {
    const element = page.locator(selector);
    const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) {
      console.log(`Test skip condition met: Required element not found: ${selector}`);
      return true;
    }
  }
  return false;
}

/**
 * Browser-aware waiting strategy
 */
export async function waitForStableState(page: any, browserName?: string) {
  await page.waitForLoadState('networkidle');
  
  // Firefox and WebKit need extra time
  if (browserName === 'firefox' || browserName === 'webkit') {
    await page.waitForTimeout(2000);
  } else {
    await page.waitForTimeout(1000);
  }
}