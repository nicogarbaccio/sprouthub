import { chromium, FullConfig } from '@playwright/test';
import { TIMEOUTS } from './config/timeouts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  const storageStatePath = path.join(__dirname, '.auth', 'user.json');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app to ensure it's running
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:8080');

    // Wait for the app to load - optimized for speed
    await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.SETUP_TEARDOWN });
    await page.waitForSelector('body', { timeout: TIMEOUTS.NAVIGATION });

    console.log('✅ App is running and accessible');

    // Create a test user and save authentication state for reuse
    console.log('🔐 Creating authenticated state for test user...');

    // Use the primary test user for auth state
    const testUser = {
      firstName: 'Test',
      lastName: 'User1',
      username: 'e2etest1',
      email: 'e2etest1@sprouthub-test.local',
      password: 'TestPassword123!',
    };

    try {
      // Navigate to auth page using full URL
      const baseUrl = config.projects[0].use.baseURL || 'http://localhost:8080';
      await page.goto(`${baseUrl}/auth`);
      await page.waitForLoadState('domcontentloaded');

      // Try to sign up (will fail if user exists, which is fine)
      const signUpTab = page.getByRole('tab', { name: /sign up/i });
      if (await signUpTab.isVisible({ timeout: 2000 })) {
        await signUpTab.click();
        await page.waitForTimeout(200);
      }

      // Fill sign-up form
      const firstNameInput = page.getByTestId('sign-up-first-name');
      if (await firstNameInput.isVisible({ timeout: 2000 })) {
        await firstNameInput.fill(testUser.firstName);
        await page.getByTestId('sign-up-last-name').fill(testUser.lastName);
        await page.getByTestId('sign-up-username').fill(testUser.username);
        await page.getByTestId('sign-up-email').fill(testUser.email);
        await page.getByTestId('sign-up-password').fill(testUser.password);
        await page.getByTestId('sign-up-confirm-password').fill(testUser.password);

        await page.getByRole('button', { name: /sign up/i }).click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
      }

      // Always try to sign in (in case user already exists)
      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        const signInTab = page.getByRole('tab', { name: /sign in/i });
        if (await signInTab.isVisible({ timeout: 2000 })) {
          await signInTab.click();
          await page.waitForTimeout(200);
        }

        const emailInput = page.getByTestId('sign-in-email');
        if (await emailInput.isVisible({ timeout: 2000 })) {
          await emailInput.fill(testUser.email);
          await page.getByTestId('sign-in-password').fill(testUser.password);

          // Use the specific test ID for the sign-in button to avoid strict mode violations
          const signInButton = page.getByTestId('sign-in-button');
          await signInButton.click();

          // Wait for authentication to complete
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000);
        }
      }

      // Verify authentication was successful
      const userMenu = page.getByTestId('user-menu');
      const hasAuth = await userMenu.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasAuth) {
        // Save authenticated state
        const authDir = path.dirname(storageStatePath);
        if (!fs.existsSync(authDir)) {
          fs.mkdirSync(authDir, { recursive: true });
        }

        await page.context().storageState({ path: storageStatePath });
        console.log('✅ Authenticated state saved for reuse');
      } else {
        console.log('⚠️ Could not create authenticated state, tests will authenticate individually');
      }
    } catch (authError) {
      console.log('⚠️ Auth state creation failed (non-critical):', authError);
    }

  } catch (error) {
    console.error('❌ Failed to connect to app:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;
