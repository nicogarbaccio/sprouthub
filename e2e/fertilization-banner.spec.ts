import { test, expect } from '@playwright/test';
import { getToast, clearFertilizationDismissals, resetFertilizationDates } from './helpers';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;

test.use({ storageState: 'e2e/.auth/user.json' });

/**
 * Clear localStorage keys that could hide the fertilization banner.
 */
async function clearBannerLocalStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fertilization_banner_dismissed_')) {
        localStorage.removeItem(key);
      }
    }
  });
}

/**
 * Navigate to dashboard with a clean fertilization state.
 * Clears localStorage and waits for the banner to appear.
 * Returns false if the banner doesn't show (not growing season).
 */
async function gotoDashboardWithBanner(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/');
  await clearBannerLocalStorage(page);
  await page.reload();
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

  // Give the banner hook time to check dismissal state
  await page.waitForTimeout(2000);
  return page.getByTestId('fertilization-banner').isVisible().catch(() => false);
}

test.describe.serial('Fertilization Banner', () => {
  // Reset fertilization state so the banner is guaranteed to show
  test.beforeAll(async () => {
    await resetFertilizationDates(TEST_EMAIL);
    await clearFertilizationDismissals(TEST_EMAIL);
  });

  // Restore clean state after all tests
  test.afterAll(async () => {
    await clearFertilizationDismissals(TEST_EMAIL);
  });

  test('should display fertilization banner on dashboard', async ({ page }) => {
    const visible = await gotoDashboardWithBanner(page);

    if (!visible) {
      test.skip(true, 'Fertilization banner not visible — not growing season or no plants');
      return;
    }

    await expect(page.getByText('Time to fertilize')).toBeVisible();
    await expect(page.getByText('Growing season', { exact: true })).toBeVisible();
    await expect(page.getByText('Show plants')).toBeVisible();
  });

  test('should expand and collapse plant list', async ({ page }) => {
    const visible = await gotoDashboardWithBanner(page);
    if (!visible) { test.skip(true, 'Banner not visible'); return; }

    // Expand
    await page.getByText('Show plants').click();
    await expect(page.getByText('Hide plants')).toBeVisible();

    const banner = page.getByTestId('fertilization-banner');
    const logButtons = banner.getByRole('button', { name: 'Log' });
    await expect(logButtons.first()).toBeVisible({ timeout: 5000 });
    await expect(banner.getByText(/Last:/).first()).toBeVisible();

    // Collapse
    await page.getByText('Hide plants').click();
    await expect(logButtons.first()).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Show plants')).toBeVisible();
  });

  test('should cancel quick-log without logging', async ({ page }) => {
    const visible = await gotoDashboardWithBanner(page);
    if (!visible) { test.skip(true, 'Banner not visible'); return; }

    await page.getByText('Show plants').click();

    const banner = page.getByTestId('fertilization-banner');
    const logButton = banner.getByRole('button', { name: 'Log' }).first();
    await expect(logButton).toBeVisible({ timeout: 5000 });

    const plantLink = banner.getByRole('link').first();
    const plantName = await plantLink.textContent();

    await logButton.click();
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 5000 });

    // Plant should still be in the list
    await expect(banner.getByRole('link', { name: plantName! })).toBeVisible();
  });

  test('should show confirmation dialog and log fertilization', async ({ page }) => {
    const visible = await gotoDashboardWithBanner(page);
    if (!visible) { test.skip(true, 'Banner not visible'); return; }

    await page.getByText('Show plants').click();

    const banner = page.getByTestId('fertilization-banner');
    const plantLink = banner.getByRole('link').first();
    const plantName = await plantLink.textContent();
    expect(plantName).toBeTruthy();

    await banner.getByRole('button', { name: 'Log' }).first().click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Log fertilization?')).toBeVisible();
    await expect(dialog.getByText(plantName!)).toBeVisible();

    // Confirm
    await page.getByRole('button', { name: 'Yes, log it' }).click();

    await expect(getToast(page, 'Fertilization Logged')).toBeVisible({ timeout: 10000 });
    await expect(banner.getByRole('link', { name: plantName! })).not.toBeVisible({ timeout: 5000 });
  });

  test('should snooze banner for 1 week', async ({ page }) => {
    // Reset dates again in case previous test logged all plants
    await resetFertilizationDates(TEST_EMAIL);
    await clearFertilizationDismissals(TEST_EMAIL);

    const visible = await gotoDashboardWithBanner(page);
    if (!visible) { test.skip(true, 'Banner not visible'); return; }

    await page.getByRole('button', { name: '1 week' }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Snooze for 1 week?')).toBeVisible();

    await page.getByRole('button', { name: 'Snooze for 1 week' }).click();

    await expect(getToast(page, 'Reminder Snoozed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('fertilization-banner')).not.toBeVisible({ timeout: 5000 });

    // Cleanup
    await clearFertilizationDismissals(TEST_EMAIL);
    await clearBannerLocalStorage(page);
  });
});
