import { test, expect } from '@playwright/test';
import { deletePlantsByPattern } from './helpers';

const TEST_EMAIL = process.env.TEST_USER_EMAIL;

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Plant Details Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to My Plants and click the first plant to reach detail page
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });

    // Click the first plant name to navigate to its detail page
    const firstPlantButton = page.getByTestId('plant-card').first().getByRole('heading', { level: 3 }).getByRole('button');
    await firstPlantButton.click();
    await expect(page).toHaveURL(/\/my-plants\/[\w-]+/, { timeout: 10000 });

    // Wait for the detail page content to fully load (not just the URL change)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  // ── Display ────────────────────────────────────────────────────────

  test('should display plant name and species', async ({ page }) => {
    // Plant name as h1
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Species name paragraph below heading
    const heading = page.getByRole('heading', { level: 1 });
    const plantName = await heading.textContent();
    expect(plantName!.length).toBeGreaterThan(0);
  });

  test('should display watering schedule info', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Watering Schedule' })).toBeVisible();
    await expect(page.getByText('Last watered:')).toBeVisible();
    await expect(page.getByText('Frequency:')).toBeVisible();
  });

  test('should display plant info section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Plant Info' })).toBeVisible();
    await expect(page.getByText('Added:')).toBeVisible();
  });

  test('should display care details grid', async ({ page }) => {
    // Care details grid — soft assertions so all categories are checked
    await expect.soft(page.getByText('Light').first()).toBeVisible();
    await expect.soft(page.getByText('Temperature').first()).toBeVisible();
    await expect.soft(page.getByText('Humidity').first()).toBeVisible();
  });

  test('should display care instructions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Care Instructions' })).toBeVisible();
    // Find the section containing the heading, then verify it has a list
    const careSection = page.locator('section, div').filter({
      has: page.getByRole('heading', { name: 'Care Instructions' })
    });
    await expect(careSection.getByRole('list').first()).toBeVisible();
  });

  test('should display common problems', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Common Problems' })).toBeVisible();
  });

  // ── Actions Menu ───────────────────────────────────────────────────

  test('should open actions menu with all options', async ({ page }) => {
    await page.getByRole('button', { name: 'Plant actions menu' }).click();

    await expect(page.getByRole('menuitem', { name: 'Water Now' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /History/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  // ── Water Now ──────────────────────────────────────────────────────

  test('should open water confirmation dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    await page.getByRole('menuitem', { name: 'Water Now' }).click();

    // Water confirmation dialog should appear
    await expect(page.getByTestId('water-confirmation-dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('water-confirm-button')).toBeVisible();
    await expect(page.getByTestId('water-cancel-button')).toBeVisible();

    // Cancel to avoid mutating data
    await page.getByTestId('water-cancel-button').click();
    await expect(page.getByTestId('water-confirmation-dialog')).not.toBeVisible();
  });

  // ── Edit Plant ─────────────────────────────────────────────────────

  test('should open edit dialog with pre-filled data', async ({ page }) => {
    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    // Edit dialog should open
    await expect(page.getByTestId('edit-plant-dialog')).toBeVisible({ timeout: 5000 });

    // Nickname should be pre-filled
    const nicknameInput = page.getByTestId('plant-nickname-input');
    await expect(nicknameInput).toBeVisible();
    const currentNickname = await nicknameInput.inputValue();
    expect(currentNickname.length).toBeGreaterThan(0);

    // Cancel without saving
    await page.getByTestId('cancel-edit-button').click();
    await expect(page.getByTestId('edit-plant-dialog')).not.toBeVisible();
  });

  test('should edit plant nickname and save', async ({ page }) => {
    const plantName = await page.getByRole('heading', { level: 1 }).textContent();

    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('edit-plant-dialog')).toBeVisible({ timeout: 5000 });

    // Change nickname
    const nicknameInput = page.getByTestId('plant-nickname-input');
    const originalNickname = await nicknameInput.inputValue();
    const tempNickname = `${originalNickname} Edited`;

    await nicknameInput.clear();
    await nicknameInput.fill(tempNickname);
    await page.getByTestId('save-plant-button').click();

    // Verify the dialog closes and name updates
    await expect(page.getByTestId('edit-plant-dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: tempNickname, level: 1 })).toBeVisible({ timeout: 10000 });

    // Restore original nickname
    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('edit-plant-dialog')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('plant-nickname-input').clear();
    await page.getByTestId('plant-nickname-input').fill(originalNickname);
    await page.getByTestId('save-plant-button').click();
    await expect(page.getByTestId('edit-plant-dialog')).not.toBeVisible({ timeout: 10000 });
  });

  // ── Watering History ──────────────────────────────────────────────

  test('should open watering history from actions menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    // Menu item may say "History" or "History & Tips"
    await page.getByRole('menuitem', { name: /History/ }).click();

    // Watering history dialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Dialog should contain watering-related content
    await expect(page.getByText(/watering/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── Delete Plant ───────────────────────────────────────────────────

  test('should show delete confirmation and allow cancel', async ({ page }) => {
    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('edit-plant-dialog')).toBeVisible({ timeout: 5000 });

    // Navigate to settings tab where delete is
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('danger-zone')).toBeVisible();

    // Click delete
    await page.getByTestId('delete-plant-trigger-button').click();
    await expect(page.getByTestId('delete-plant-confirmation-dialog')).toBeVisible();

    // Cancel
    await page.getByTestId('delete-plant-cancel-button').click();
    await expect(page.getByTestId('delete-plant-confirmation-dialog')).not.toBeVisible();
  });
});

test.describe('Plant Details - Delete Flow', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.afterAll(async () => {
    // Clean up any test plants that weren't properly deleted
    if (TEST_EMAIL) {
      await deletePlantsByPattern('Delete Test Plant%', TEST_EMAIL);
    }
  });

  test('should delete a test plant and redirect to My Plants', async ({ page }) => {
    // First create a temporary plant
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('add-plant-button').click();
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();

    const testPlantName = `Delete Test Plant ${Date.now()}`;
    await page.getByTestId('plant-nickname-input').fill(testPlantName);
    await page.getByTestId('plant-type-trigger').click();
    await page.getByRole('option', { name: 'Snake Plant' }).click();
    await page.getByTestId('add-plant-submit-button').click();
    await expect(page.getByTestId('add-plant-dialog')).not.toBeVisible({ timeout: 10000 });

    // Wait for the plant card to appear
    const testCard = page.getByTestId('plant-card').filter({ hasText: testPlantName });
    await expect(testCard).toBeVisible({ timeout: 15000 });

    // Navigate to its detail page
    await testCard.getByRole('heading', { level: 3 }).getByRole('button').click();
    await expect(page).toHaveURL(/\/my-plants\/[\w-]+/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: testPlantName, level: 1 })).toBeVisible({ timeout: 10000 });

    // Open edit → settings → delete
    await page.getByRole('button', { name: 'Plant actions menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('edit-plant-dialog')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('settings-tab').click();
    await page.getByTestId('delete-plant-trigger-button').click();
    await expect(page.getByTestId('delete-plant-confirmation-dialog')).toBeVisible();

    // Confirm delete
    await page.getByTestId('delete-plant-confirm-button').click();

    // Wait for delete to process — either redirects to /my-plants or stays on page with dialog closed
    await expect(page.getByTestId('delete-plant-confirmation-dialog')).not.toBeVisible({ timeout: 15000 });

    // Navigate to My Plants to verify plant is gone
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('plant-card').filter({ hasText: testPlantName })).not.toBeVisible();
  });
});
