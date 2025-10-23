import { defineConfig, devices } from '@playwright/test';
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from default ".env" file.
dotenv.config();

// Read from ".env.local" file.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// Path to auth storage state
const authStorageState = path.join(__dirname, 'tests', '.auth', 'user.json');
const hasAuthStorageState = fs.existsSync(authStorageState);

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // Fix tests instead of retrying - was masking flaky tests
  workers: process.env.CI ? 1 : undefined, // Use defaults, single worker in CI for stability
  timeout: 15000, // Reduced from 30000 - tests should be fast
  expect: {
    timeout: 5000, // Reduced from 10000 - fail fast on issues
  },
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    actionTimeout: 5000, // Reduced from 10000 - actions should be quick
    navigationTimeout: 10000, // Reduced from 15000 - pages should load faster
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use auth storage state if it exists (created by global-setup)
        ...(hasAuthStorageState ? { storageState: authStorageState } : {}),
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
    // Firefox and WebKit temporarily disabled while stabilizing tests
    // Re-enable after Chromium tests are stable for 1 week
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});
