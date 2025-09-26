import { test, expect } from '../../fixtures/test-fixtures';
import { getTestUser } from '../../test-user-pool';

test.describe('Watering Record Error Handling', () => {
  const testUser = getTestUser('watering-error-handling');

  test.beforeEach(async ({ page }) => {
    console.log('Setting up error handling tests...');
  });

  test.afterEach(async ({ page }) => {
    // Reset page state
    await page.reload();
  });

  test('should handle network errors during deletion', async ({ page }) => {
    await page.goto('http://localhost:9000/watering-record-network-error.html');

    // Verify initial state
    const deleteButton = page.getByTestId('delete-watering-watering-1');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();

    // Click delete button
    await deleteButton.click();

    // Verify loading state
    await expect(deleteButton).toHaveAttribute('disabled', '', {
      timeout: 5000
    });
    await expect(deleteButton).toContainText('Deleting...');

    // Wait for and verify error message
    await expect(page.getByTestId('error-message')).toBeVisible({
      timeout: 5000
    });
    await expect(page.getByTestId('error-message')).toContainText('Network error');

    // Verify record still exists
    await expect(page.getByTestId('watering-record-watering-1')).toBeVisible();

    // Verify button is re-enabled
    await expect(deleteButton).toBeEnabled();
    await expect(deleteButton).toContainText('Delete');

    // Verify error was tracked
    const errorOccurred = await page.evaluate(() => window.errorOccurred);
    expect(errorOccurred).toBe(true);
  });

  test('should handle multiple deletion attempts during error state', async ({ page }) => {
    await page.goto('http://localhost:9000/watering-record-error.html');

    const deleteButton = page.getByTestId('delete-watering-watering-1');

    // First attempt
    await deleteButton.click();
    await expect(page.getByTestId('error-message')).toBeVisible({
      timeout: 5000
    });

    // Try clicking again while in error state
    await deleteButton.click();
    await deleteButton.click();

    // Verify only one error message is shown
    const errorMessages = await page.locator('[data-testid="error-message"]').count();
    expect(errorMessages).toBe(1);

    // Verify delete attempts were properly tracked
    const deleteAttempts = await page.evaluate(() => window.deleteAttempts);
    expect(deleteAttempts).toBe(1);
  });
});
