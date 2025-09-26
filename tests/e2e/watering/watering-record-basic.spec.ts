import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';

test.describe('Basic Watering Record Operations', () => {
  const testUser = getTestUser('watering-basic-operations');

  test.beforeEach(async ({ page }) => {
    console.log('Setting up basic watering record tests...');
  });

  test.afterEach(async ({ page }) => {
    // Reset page state
    await page.reload();
  });

  test('should successfully delete a watering record', async ({ page }) => {
    await page.goto('http://localhost:9000/watering-record-basic.html');

    // Verify initial state
    const deleteButton = page.getByTestId('delete-watering-watering-1');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
    await expect(deleteButton).toContainText('Delete');

    // Click delete button
    await deleteButton.click();

    // Verify loading state
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText('Deleting...');

    // Wait for and verify deletion
    await expect(page.getByTestId('watering-record-watering-1')).toBeHidden({
      timeout: 5000
    });

    // Verify success message
    await expect(page.getByTestId('success-message')).toBeVisible({
      timeout: 5000
    });
    await expect(page.getByTestId('success-message')).toContainText('deleted successfully');
  });

  test('should handle empty watering records list', async ({ page }) => {
    await page.goto('http://localhost:9000/watering-record-empty.html');

    // Verify empty state message
    await expect(page.getByTestId('empty-state-message')).toBeVisible();
    await expect(page.getByTestId('empty-state-message')).toContainText('No watering records yet');

    // Verify no delete buttons are present
    const deleteButtons = page.locator('[data-testid^="delete-watering-"]');
    const deleteCount = await deleteButtons.count();
    expect(deleteCount).toBe(0);
  });
});
