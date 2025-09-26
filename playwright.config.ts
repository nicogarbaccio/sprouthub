import { defineConfig, devices } from '@playwright/test';
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from default ".env" file.
dotenv.config();

// Read from ".env.local" file.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // More retries for flaky tests
  workers: process.env.CI ? 2 : 3, // Reduce workers for stability
  timeout: 30000, // Increased global timeout
  expect: {
    timeout: 10000, // Longer expect timeout
  },
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    actionTimeout: 10000, // Timeout for actions like click, fill
    navigationTimeout: 15000, // Timeout for page navigations
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chromium-specific settings
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox needs longer timeouts
        actionTimeout: 15000,
        navigationTimeout: 20000,
      },
      timeout: 45000, // Firefox-specific longer test timeout
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit needs longer timeouts  
        actionTimeout: 15000,
        navigationTimeout: 20000,
      },
      timeout: 45000, // WebKit-specific longer test timeout
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000, // Increased back to 60s for reliability
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npx http-server ./tests/e2e/fixtures -p 9000',
      url: 'http://localhost:9000',
      reuseExistingServer: !process.env.CI,
      timeout: 5000,
    },
  ],

  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});
