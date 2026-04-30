import { test, expect } from '@playwright/test';

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Households List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/households');
    await expect(page.getByRole('heading', { name: 'Households' })).toBeVisible({ timeout: 15000 });
  });

  test('should display households page with existing household', async ({ page }) => {
    await expect(page.getByText(/plant care/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Household' })).toBeVisible();

    // At least one household card
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
  });

  test('should display household card with member count', async ({ page }) => {
    // At least one household heading visible
    const headings = page.getByRole('heading', { level: 3 });
    await expect(headings.first()).toBeVisible();
    // Member count
    await expect(page.getByText(/\d+ member/).first()).toBeVisible();
  });

  test('should navigate to household management page', async ({ page }) => {
    await page.getByRole('link', { name: 'Manage' }).first().click();
    await expect(page).toHaveURL(/\/households\/[\w-]+/, { timeout: 10000 });
  });
});

test.describe('Household Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to households list, then click Manage on the main household (with plants)
    await page.goto('/households');
    await expect(page.getByRole('heading', { name: 'Households' })).toBeVisible({ timeout: 15000 });
    // Click the Manage link within the card that contains "Willa's House" (the main household with plants)
    const mainHousehold = page.getByTestId('household-card').filter({
      has: page.getByRole('heading', { name: "Willa's House", level: 3 })
    });
    await mainHousehold.getByRole('link', { name: 'Manage' }).click();
    await expect(page).toHaveURL(/\/households\/[\w-]+/, { timeout: 10000 });
  });

  // ── Display ────────────────────────────────────────────────────────

  test('should display household name and role badge', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Owner badge is displayed
    await expect(page.getByText('Owner').first()).toBeVisible();
  });

  test('should display members section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Invite Member' })).toBeVisible();
  });

  test('should display household plants', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Household Plants/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Plant' })).toBeVisible();
    // At least one plant listed — plants have aria-label "View details for <name>"
    await expect(page.locator('[aria-label^="View details for"]').first()).toBeVisible();
  });

  test('should display settings sidebar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Use .first() to avoid strict mode when text appears in both settings card and elsewhere
    await expect.soft(page.getByText('Created').first()).toBeVisible();
    await expect.soft(page.getByText('Members').first()).toBeVisible();
    await expect.soft(page.getByText('Your Role').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Household' })).toBeVisible();
  });

  // ── Invite Member Dialog ───────────────────────────────────────────

  test('should open and close invite member dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Invite Member' }).click();
    await expect(page.getByTestId('invite-member-dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('invite-email-input')).toBeVisible();

    // Cancel
    await page.getByTestId('invite-member-cancel-button').click();
    await expect(page.getByTestId('invite-member-dialog')).not.toBeVisible();
  });

  // ── Water Plant from Household ────────────────────────────────────

  test('should show water option in plant actions dropdown', async ({ page }) => {
    // Open the first plant's actions dropdown
    const actionsButton = page.getByRole('button', { name: 'Plant actions menu' }).first();
    await expect(actionsButton).toBeVisible({ timeout: 10000 });
    await actionsButton.click();

    // "Water Now" menu item should be visible
    await expect(page.getByRole('menuitem', { name: 'Water Now' })).toBeVisible();

    // Close dropdown without acting (press Escape)
    await page.keyboard.press('Escape');
  });

  // ── Navigate to Plant Detail ───────────────────────────────────────

  test('should navigate to plant detail from household', async ({ page }) => {
    const plantLink = page.locator('[aria-label^="View details for"]').first();
    await plantLink.click();

    await expect(page).toHaveURL(/\/my-plants\/[\w-]+/, { timeout: 10000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Household - Create & Delete', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('should create a household then delete it', async ({ page }) => {
    const householdName = `Test Household ${Date.now()}`;

    // ── Create ──
    await page.goto('/households');
    await expect(page.getByRole('heading', { name: 'Households' })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Create Household' }).click();
    await expect(page.getByTestId('create-household-dialog')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('household-name-input').fill(householdName);
    await page.getByTestId('create-household-submit-button').click();

    // Dialog should close and new household should appear
    await expect(page.getByTestId('create-household-dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: householdName, level: 3 })).toBeVisible({ timeout: 15000 });

    // ── Delete ──
    // The new household heading has a sibling "Manage" link in the same card.
    // Find the link by looking for all manage links and matching by proximity to our heading.
    // Simplest approach: get the href of the Manage link that follows our household heading.
    // Get the enclosing card by filtering for the one with our household heading
    const card = page.getByTestId('household-card').filter({
      has: page.getByRole('heading', { name: householdName, level: 3 })
    });
    await card.getByRole('link', { name: 'Manage' }).click();
    await expect(page).toHaveURL(/\/households\/[\w-]+/, { timeout: 10000 });

    // Click Delete Household
    await page.getByRole('button', { name: 'Delete Household' }).click();

    // Confirmation dialog — click the destructive action button
    const confirmButton = page.getByRole('button', { name: /delete/i }).last();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Should redirect back to households list
    await expect(page).toHaveURL(/\/households/, { timeout: 15000 });

    // Verify deleted household is gone (auto-retries — no manual wait needed)
    await expect(page.getByRole('heading', { name: householdName, level: 3 })).not.toBeVisible({ timeout: 10000 });
  });
});
