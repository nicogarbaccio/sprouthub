/**
 * Standalone script to create authenticated storage state for Playwright tests
 * Run this before running tests: npx ts-node tests/create-auth-state.ts
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

async function createAuthState() {
  console.log('🚀 Creating authenticated storage state...');

  const storageStatePath = path.join(__dirname, '.auth', 'user.json');
  const baseURL = 'http://localhost:8080';

  const browser = await chromium.launch({
    headless: true, // Changed back to true for speed
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Use real test user credentials from environment
    const testUser = {
      email: process.env.TEST_EMAIL || 'test@sprouthub.app',
      password: process.env.TEST_PASSWORD || 'TestPassword123!',
    };

    console.log(`📧 Using test email: ${testUser.email}`);

    console.log(`📍 Navigating to ${baseURL}/auth...`);
    await page.goto(`${baseURL}/auth`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Sign in with existing test user
    console.log('🔐 Signing in with test credentials...');

    // Make sure we're on the sign-in tab
    const signInTab = page.getByRole('tab', { name: /sign in/i });
    if (await signInTab.isVisible({ timeout: 2000 })) {
      await signInTab.click();
      await page.waitForTimeout(300);
    }

    // Fill in credentials
    const emailInput = page.getByTestId('sign-in-email');
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill(testUser.email);
      await page.getByTestId('sign-in-password').fill(testUser.password);

      // Use the specific test ID for the sign-in button to avoid strict mode violations
      const submitButton = page.getByTestId('sign-in-button');
      await submitButton.click();

      // Wait for navigation/auth to complete
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000); // Give more time for auth to complete
    }

    // Check if authentication was successful
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);

    const userMenu = page.getByTestId('user-menu');
    const addPlantButton = page.getByRole('button', { name: /add.*plant/i }).first();

    const hasUserMenu = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);
    const hasAddPlant = await addPlantButton.isVisible({ timeout: 2000 }).catch(() => false);
    const isAuthenticated = hasUserMenu || hasAddPlant;

    console.log(`🔍 Auth indicators - User menu: ${hasUserMenu}, Add plant: ${hasAddPlant}`);

    if (isAuthenticated) {
      console.log('✅ Authentication successful!');

      // Save the storage state
      const authDir = path.dirname(storageStatePath);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      await context.storageState({ path: storageStatePath });
      console.log(`✅ Auth state saved to: ${storageStatePath}`);
    } else {
      console.log('❌ Authentication failed - no auth indicators visible');
      console.log('📸 Taking screenshot for debugging...');
      await page.screenshot({ path: 'tests/auth-debug.png', fullPage: true });
      console.log('Screenshot saved to tests/auth-debug.png');
      throw new Error('Authentication failed');
    }

  } catch (error) {
    console.error('❌ Error creating auth state:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAuthState()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create auth state:', error);
      process.exit(1);
    });
}

export default createAuthState;
