import { test, expect } from '@playwright/test';
import { deletePlantsByPattern } from './helpers';

// Use credentials from environment variables or .env.test (needed for cleanup)
const TEST_EMAIL = process.env.TEST_USER_EMAIL;

// Reuse authenticated state from the setup project — no per-test login needed
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Plant Collection - Add Plants', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to My Plants — already authenticated via storageState
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });
  });

  test.afterAll(async () => {
    if (!TEST_EMAIL) return;
    // Clean up all test plants created during tests
    // These patterns match the plant nicknames created in the tests
    await deletePlantsByPattern('Test Snake%', TEST_EMAIL);
    await deletePlantsByPattern('Pothos%', TEST_EMAIL);
    await deletePlantsByPattern('Custom%', TEST_EMAIL);
  });

  test('should open Add Plant dialog from My Plants page', async ({ page }) => {
    // Click "Add New Plant" button on My Plants page
    await page.getByTestId('add-plant-button').click();

    // Verify dialog is open
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Add New Plant/i })).toBeVisible();

    // Verify form elements are present
    await expect(page.getByTestId('plant-nickname-input')).toBeVisible();
    await expect(page.getByTestId('plant-type-trigger')).toBeVisible();
  });

  test('should add a plant with minimal required information', async ({ page }) => {
    const plantNickname = `Test Snake ${Date.now()}`;

    // Click Add Plant button
    await page.getByTestId('add-plant-button').click();
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();

    // Fill required fields
    await page.getByTestId('plant-nickname-input').fill(plantNickname);

    // Select a plant type - click trigger to open dropdown
    await page.getByTestId('plant-type-trigger').click();

    // Click on "Snake Plant" from the dropdown (not from the existing plant cards)
    await page.locator('.plant-type-dropdown div.cursor-pointer').filter({ hasText: /^Snake Plant$/ }).click();

    // Submit form
    await page.getByTestId('add-plant-submit-button').click();

    // Verify dialog closed
    await expect(page.getByTestId('add-plant-dialog')).not.toBeVisible({ timeout: 10000 });

    // Verify the plant appears in collection
    await expect(page.locator('[data-testid="plant-card"]').filter({ hasText: plantNickname })).toBeVisible({ timeout: 15000 });
  });

  test('should add a plant by searching plant type', async ({ page }) => {
    const plantNickname = `Pothos ${Date.now()}`;

    await page.getByTestId('add-plant-button').click();
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();

    await page.getByTestId('plant-nickname-input').fill(plantNickname);

    // Open plant type dropdown and search
    await page.getByTestId('plant-type-trigger').click();
    await page.getByTestId('plant-type-search-input').fill('Pothos');

    // Click on the search result in the dropdown (use the div container)
    await page.locator('.plant-type-dropdown div.cursor-pointer').filter({ hasText: /^Pothos$/ }).click();

    // Submit
    await page.getByTestId('add-plant-submit-button').click();

    await expect(page.getByTestId('add-plant-dialog')).not.toBeVisible({ timeout: 10000 });

    // Verify the plant appears in collection
    await expect(page.locator('[data-testid="plant-card"]').filter({ hasText: plantNickname })).toBeVisible({ timeout: 15000 });
  });

  test('should add a custom plant type not in catalog', async ({ page }) => {
    const plantNickname = `Custom ${Date.now()}`;
    const customType = `Rare Plant ${Date.now()}`;

    await page.getByTestId('add-plant-button').click();
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();

    await page.getByTestId('plant-nickname-input').fill(plantNickname);

    // Open dropdown and type custom plant name
    await page.getByTestId('plant-type-trigger').click();
    await page.getByTestId('plant-type-search-input').fill(customType);

    // Click "Add as custom" option
    await page.getByText(`Add "${customType}" as custom`).click();

    await page.getByTestId('add-plant-submit-button').click();

    await expect(page.getByTestId('add-plant-dialog')).not.toBeVisible({ timeout: 10000 });

    // Wait for the plant card to appear in the collection after refetch
    await expect(page.locator('[data-testid="plant-card"]').filter({ hasText: plantNickname })).toBeVisible({ timeout: 15000 });
  });

  test('should cancel adding a plant', async ({ page }) => {
    await page.getByTestId('add-plant-button').click();
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();

    // Fill some data
    await page.getByTestId('plant-nickname-input').fill('Cancel Test');

    // Click cancel
    await page.getByTestId('add-plant-cancel-button').click();

    // Verify dialog closed
    await expect(page.getByTestId('add-plant-dialog')).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByTestId('add-plant-button').click();
    await expect(page.getByTestId('add-plant-dialog')).toBeVisible();

    // The submit button should be disabled when form is invalid
    const submitButton = page.getByTestId('add-plant-submit-button');

    // Button is disabled until required fields are filled
    await expect(submitButton).toBeDisabled();

    // Fill nickname but not plant type
    await page.getByTestId('plant-nickname-input').fill('Test');

    // Button should still be disabled
    await expect(submitButton).toBeDisabled();
  });
});
