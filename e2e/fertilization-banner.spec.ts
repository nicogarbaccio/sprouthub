import { test, expect } from '@playwright/test';
import {
  getToast,
  clearFertilizationDismissals,
  resetFertilizationDates,
} from './helpers';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;

/**
 * The banner only shows in growing season (spring and summer). The app falls back to the
 * browser's time zone for the hemisphere, so pick one where it's growing season today:
 * March 20 – September 21 in the north, the rest of the year in the south.
 */
function growingSeasonTimeZone(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();
  const northernGrowing = (month === 2 && day >= 20) || (month > 2 && month < 8) || (month === 8 && day < 22);
  return northernGrowing ? 'America/New_York' : 'Australia/Sydney';
}

test.use({ storageState: 'e2e/.auth/user.json', timezoneId: growingSeasonTimeZone() });

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
 * Navigate to the dashboard with a clean fertilization state and wait for the banner.
 * The seeded plants have never been fertilized and it's growing season (see the time
 * zone above), so a missing banner is a failure, not a reason to skip.
 */
async function gotoDashboardWithBanner(page: import('@playwright/test').Page) {
  await page.goto('/');
  await clearBannerLocalStorage(page);
  await page.reload();
  await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('fertilization-banner')).toBeVisible({ timeout: 10000 });
}

test.describe.serial('Fertilization Banner', () => {
  // The seed resets the account before each run; this also undoes a rerun of this file alone
  test.beforeAll(async () => {
    await resetFertilizationDates(TEST_EMAIL);
    await clearFertilizationDismissals(TEST_EMAIL);
  });

  test('should display fertilization banner on dashboard', async ({ page }) => {
    await gotoDashboardWithBanner(page);

    await expect(page.getByText('Time to fertilize')).toBeVisible();
    await expect(page.getByText('Growing season', { exact: true })).toBeVisible();
    await expect(page.getByText('Show plants')).toBeVisible();
  });

  test('should expand and collapse plant list', async ({ page }) => {
    await gotoDashboardWithBanner(page);

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
    await gotoDashboardWithBanner(page);

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
    await gotoDashboardWithBanner(page);

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
    // Reset dates again in case the previous test logged every plant
    await resetFertilizationDates(TEST_EMAIL);
    await clearFertilizationDismissals(TEST_EMAIL);

    await gotoDashboardWithBanner(page);

    await page.getByRole('button', { name: '1 week' }).click();

    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Snooze for 1 week?')).toBeVisible();

    await page.getByRole('button', { name: 'Snooze for 1 week' }).click();

    await expect(getToast(page, 'Reminder Snoozed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('fertilization-banner')).not.toBeVisible({ timeout: 5000 });

    // Cleanup dismissals
    await clearFertilizationDismissals(TEST_EMAIL);
    await clearBannerLocalStorage(page);
  });
});
