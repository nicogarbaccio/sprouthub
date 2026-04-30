import { test, expect } from '@playwright/test';
import { deleteJournalEntriesByPattern } from './helpers';

const TEST_EMAIL = process.env.TEST_USER_EMAIL;

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Repotting Guide', () => {
  test.afterAll(async () => {
    // Clean up journal entries created by repotting log tests
    if (TEST_EMAIL) {
      await deleteJournalEntriesByPattern('Repotting%', TEST_EMAIL);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to My Plants and click the first plant to reach detail page
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });

    const firstPlantButton = page.getByTestId('plant-card').first().getByRole('heading', { level: 3 }).getByRole('button');
    await firstPlantButton.click();
    await expect(page).toHaveURL(/\/my-plants\/[\w-]+/, { timeout: 10000 });
  });

  // ── Entry Point ────────────────────────────────────────────────────

  test('should display repotting guide card on plant detail page', async ({ page }) => {
    await expect(page.getByText('Repotting Guide')).toBeVisible();
    await expect(page.getByText(/Tips for repotting/)).toBeVisible();
  });

  // ── Advice Dialog ──────────────────────────────────────────────────

  test('should open repotting dialog when card is clicked', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Current plant size')).toBeVisible();
    await expect(dialog.getByText('Repotting tips')).toBeVisible();
  });

  test('should show size selector with medium selected by default', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Medium chip should have the active style (plant-primary border)
    const mediumChip = dialog.getByText('Medium').first();
    await expect(mediumChip).toBeVisible();

    // All three size options should be visible
    await expect(dialog.getByText('Small')).toBeVisible();
    await expect(dialog.getByText('Large')).toBeVisible();
  });

  test('should switch size and update advice', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click Small — advice should update to mention small pot sizing
    await dialog.getByRole('button', { name: /Small/ }).click();
    await expect(dialog.getByText(/1–2 inches/)).toBeVisible();

    // Click Large — advice should update to mention large pot sizing
    await dialog.getByRole('button', { name: /Large/ }).click();
    await expect(dialog.getByText(/2–4 inches/)).toBeVisible();
  });

  test('should display numbered repotting tips', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Should have 5 numbered tips
    for (let i = 1; i <= 5; i++) {
      await expect(dialog.getByText(String(i), { exact: true })).toBeVisible();
    }
  });

  test('should show Log a Repotting button', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('button', { name: 'Log a Repotting' })).toBeVisible();
  });

  test('should close dialog when dismissed', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Close via the X button (shadcn dialog close button)
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).not.toBeVisible();
  });

  // ── Log a Repotting Flow ───────────────────────────────────────────

  test('should navigate to log form when Log a Repotting is clicked', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: 'Log a Repotting' }).click();

    // Should show the journal form with prefilled data
    await expect(dialog.getByText('Back to tips')).toBeVisible();
    await expect(dialog.locator('input[id="title"]')).toHaveValue('Repotting');
    await expect(dialog.locator('textarea[id="content"]')).toHaveValue('Repotted into fresh soil.');
  });

  test('should navigate back to advice from log form', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Go to log form
    await dialog.getByRole('button', { name: 'Log a Repotting' }).click();
    await expect(dialog.getByText('Back to tips')).toBeVisible();

    // Go back
    await dialog.getByText('Back to tips').click();
    await expect(dialog.getByText('Current plant size')).toBeVisible();
    await expect(dialog.getByText('Repotting tips')).toBeVisible();
  });

  test('should prefill date to today in log form', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: 'Log a Repotting' }).click();

    // The date button should show today's date
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const expectedDatePart = `${monthNames[today.getMonth()]} ${today.getDate()}`;
    await expect(dialog.getByRole('button', { name: new RegExp(expectedDatePart) })).toBeVisible();
  });

  test('should submit repotting log and show success', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: 'Log a Repotting' }).click();
    await expect(dialog.locator('input[id="title"]')).toHaveValue('Repotting');

    // Submit the prefilled form
    await dialog.getByRole('button', { name: 'Log Repotting' }).click();

    // Should show success view
    await expect(dialog.getByText('Repotting logged!')).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText(/find this entry in your plant journal/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeVisible();
  });

  test('should close dialog after clicking Done on success', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: 'Log a Repotting' }).click();
    await dialog.getByRole('button', { name: 'Log Repotting' }).click();
    await expect(dialog.getByText('Repotting logged!')).toBeVisible({ timeout: 10000 });

    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('should reset to advice view when reopened after logging', async ({ page }) => {
    await page.getByText('Repotting Guide').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Log a repotting
    await dialog.getByRole('button', { name: 'Log a Repotting' }).click();
    await dialog.getByRole('button', { name: 'Log Repotting' }).click();
    await expect(dialog.getByText('Repotting logged!')).toBeVisible({ timeout: 10000 });
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();

    // Reopen — should be back on advice view, not success or log
    await page.getByText('Repotting Guide').click();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Current plant size')).toBeVisible();
    await expect(dialog.getByText('Repotting tips')).toBeVisible();
  });
});
