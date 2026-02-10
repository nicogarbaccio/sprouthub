import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate as test user', async ({ page }) => {
  const TEST_EMAIL = process.env.TEST_USER_EMAIL;
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  }

  await page.goto('/auth');
  await page.getByTestId('sign-in-email').fill(TEST_EMAIL);
  await page.getByTestId('sign-in-password').fill(TEST_PASSWORD);
  await page.getByTestId('sign-in-button').click();

  // Wait for successful login and dashboard to load
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

  // Save the authenticated browser state (cookies, localStorage, etc.)
  await page.context().storageState({ path: authFile });
});
