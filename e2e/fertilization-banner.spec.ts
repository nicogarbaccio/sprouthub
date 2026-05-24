import { test, expect } from '@playwright/test';
import {
  getToast,
  clearFertilizationDismissals,
  resetFertilizationDates,
  saveFertilizationDates,
  restoreFertilizationDates,
  type FertilizationSnapshot,
} from './helpers';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;

test.use({ storageState: 'e2e/.auth/user.json' });

// Snapshot of original fertilization dates — saved in beforeAll, restored in afterAll
let savedSnapshot: FertilizationSnapshot[] = [];

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

  // Wait for the banner to appear (or determine it won't show)
  try {
    await expect(page.getByTestId('fertilization-banner')).toBeVisible({ timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

test.describe.serial('Fertilization Banner', () => {
  // Save original dates, then reset so the banner shows
  test.beforeAll(async () => {
    savedSnapshot = await saveFertilizationDates(TEST_EMAIL);
    await resetFertilizationDates(TEST_EMAIL);
    await clearFertilizationDismissals(TEST_EMAIL);
  });

  // Always restore original dates after tests
  test.afterAll(async () => {
    await restoreFertilizationDates(savedSnapshot);
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
    await expect(banner.getByText(/Last fertilized:/).first()).toBeVisible();

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
    // (afterAll will still restore the original snapshot)
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

    // Cleanup dismissals (date restore happens in afterAll)
    await clearFertilizationDismissals(TEST_EMAIL);
    await clearBannerLocalStorage(page);
  });
});
