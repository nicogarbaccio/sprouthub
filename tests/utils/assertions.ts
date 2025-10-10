import { expect, Locator, Page } from '@playwright/test';

/**
 * Assert element is visible with reasonable timeout
 * More readable than expect().toBeVisible()
 * 
 * @example
 * await expectVisible(page.getByRole('button', { name: 'Add Plant' }));
 * await expectVisible(plantCard, 'Plant card should be visible');
 */
export async function expectVisible(locator: Locator, message?: string) {
  await expect(locator, message).toBeVisible({ timeout: 5000 });
}

/**
 * Assert element contains specific text
 * Combines visibility check with text assertion
 * 
 * @example
 * await expectText(plantCard, 'Monstera');
 * await expectText(statusBadge, /overdue|due now/i);
 */
export async function expectText(locator: Locator, text: string | RegExp) {
  await expect(locator).toBeVisible({ timeout: 5000 });
  await expect(locator).toContainText(text);
}

/**
 * Assert dialog appears with specific title or content
 * Returns the dialog locator for further interactions
 * 
 * @example
 * const dialog = await expectDialog(page, /add.*plant/i);
 * await dialog.getByRole('button', { name: 'Save' }).click();
 */
export async function expectDialog(page: Page, titlePattern: string | RegExp): Promise<Locator> {
  const dialog = page.getByRole('dialog').filter({ hasText: titlePattern });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  return dialog;
}

/**
 * Assert toast notification appears
 * Waits for toast to be visible and optionally checks message
 * 
 * @example
 * await expectToast(page, /plant.*added|success/i);
 * await expectToast(page, 'Network error');
 */
export async function expectToast(page: Page, message?: string | RegExp) {
  const toast = message 
    ? page.getByRole('alert').filter({ hasText: message })
    : page.getByRole('alert').first();
  
  await expect(toast).toBeVisible({ timeout: 3000 });
  return toast;
}

/**
 * Assert element is not visible (properly handles non-existent elements)
 * Better than expect().not.toBeVisible() for elements that might not exist
 * 
 * @example
 * await expectNotVisible(loadingSkeleton);
 * await expectNotVisible(errorMessage);
 */
export async function expectNotVisible(locator: Locator) {
  await expect(locator).not.toBeVisible({ timeout: 5000 });
}

/**
 * Assert URL matches pattern
 * More convenient than expect(page).toHaveURL()
 * 
 * @example
 * await expectURL(page, '/my-plants');
 * await expectURL(page, /plant-catalog|catalog/);
 */
export async function expectURL(page: Page, pattern: string | RegExp) {
  await expect(page).toHaveURL(pattern, { timeout: 5000 });
}

/**
 * Assert element is enabled (not disabled)
 * Useful for testing button states
 * 
 * @example
 * await expectEnabled(submitButton);
 */
export async function expectEnabled(locator: Locator, message?: string) {
  await expect(locator, message).toBeEnabled({ timeout: 5000 });
}

/**
 * Assert element is disabled
 * Useful for testing button states during loading
 * 
 * @example
 * await expectDisabled(submitButton, 'Submit button should be disabled during loading');
 */
export async function expectDisabled(locator: Locator, message?: string) {
  await expect(locator, message).toBeDisabled({ timeout: 5000 });
}

/**
 * Assert element has specific count
 * Useful for testing lists, grids, etc.
 * 
 * @example
 * await expectCount(page.getByTestId('plant-card'), 5);
 * await expectCount(errorMessages, 0);
 */
export async function expectCount(locator: Locator, count: number, message?: string) {
  await expect(locator, message).toHaveCount(count, { timeout: 5000 });
}

/**
 * Assert element has specific attribute value
 * Useful for testing ARIA attributes, data attributes, etc.
 * 
 * @example
 * await expectAttribute(button, 'aria-expanded', 'true');
 * await expectAttribute(input, 'disabled', '');
 */
export async function expectAttribute(locator: Locator, name: string, value: string | RegExp) {
  await expect(locator).toHaveAttribute(name, value, { timeout: 5000 });
}

/**
 * Assert element has specific CSS class
 * Useful for testing styling and states
 * 
 * @example
 * await expectClass(button, 'active');
 * await expectClass(card, /highlighted|selected/);
 */
export async function expectClass(locator: Locator, className: string | RegExp) {
  await expect(locator).toHaveClass(className, { timeout: 5000 });
}

/**
 * Assert element value (for inputs, selects, etc.)
 * 
 * @example
 * await expectValue(nameInput, 'Monstera');
 * await expectValue(quantityInput, '5');
 */
export async function expectValue(locator: Locator, value: string | RegExp) {
  await expect(locator).toHaveValue(value, { timeout: 5000 });
}

/**
 * Assert page title matches pattern
 * Useful for testing navigation and meta tags
 * 
 * @example
 * await expectTitle(page, 'My Plants | Sprouthub');
 * await expectTitle(page, /sprouthub/i);
 */
export async function expectTitle(page: Page, title: string | RegExp) {
  await expect(page).toHaveTitle(title, { timeout: 5000 });
}

/**
 * Assert banner appears (common UI element)
 * Combines visibility check with optional text assertion
 * 
 * @example
 * const banner = await expectBanner(page, /seasonal.*review/i);
 * await banner.getByRole('button', { name: 'Review' }).click();
 */
export async function expectBanner(page: Page, textPattern?: string | RegExp): Promise<Locator> {
  const banner = textPattern
    ? page.locator('[role="banner"], [data-testid*="banner"]').filter({ hasText: textPattern })
    : page.locator('[role="banner"], [data-testid*="banner"]').first();
  
  await expect(banner).toBeVisible({ timeout: 5000 });
  return banner;
}

/**
 * Assert loading state is visible
 * Useful for testing that loading indicators appear
 * 
 * @example
 * await expectLoading(page);
 */
export async function expectLoading(page: Page) {
  const loader = page.locator('[data-testid*="loading"], [class*="skeleton"], [class*="spinner"]').first();
  await expect(loader).toBeVisible({ timeout: 3000 });
}

/**
 * Assert loading state has finished
 * Waits for loading indicators to disappear
 * 
 * @example
 * await expectLoadingFinished(page);
 */
export async function expectLoadingFinished(page: Page) {
  const loader = page.locator('[data-testid*="loading"], [class*="skeleton"], [class*="spinner"]').first();
  
  // Only wait if loader is present
  if (await loader.isVisible({ timeout: 1000 }).catch(() => false)) {
    await expect(loader).not.toBeVisible({ timeout: 5000 });
  }
}

/**
 * Assert empty state is shown
 * Useful for testing when lists/grids have no data
 * 
 * @example
 * await expectEmptyState(page, /no plants|add.*first.*plant/i);
 */
export async function expectEmptyState(page: Page, textPattern: string | RegExp) {
  const emptyState = page.getByText(textPattern);
  await expect(emptyState).toBeVisible({ timeout: 5000 });
}

/**
 * Assert error message is shown
 * Combines common error message patterns
 * 
 * @example
 * await expectError(page, /network.*error|failed/i);
 */
export async function expectError(page: Page, messagePattern: string | RegExp) {
  const error = page.locator('[role="alert"], [data-testid*="error"], .error-message').filter({ 
    hasText: messagePattern 
  });
  await expect(error).toBeVisible({ timeout: 5000 });
}

/**
 * Assert button is in loading state
 * Checks for disabled state and loading text/icon
 * 
 * @example
 * await expectButtonLoading(saveButton, /saving|loading/i);
 */
export async function expectButtonLoading(button: Locator, loadingText?: string | RegExp) {
  await expect(button).toBeDisabled({ timeout: 3000 });
  
  if (loadingText) {
    await expect(button).toContainText(loadingText);
  }
}

/**
 * Wait for and assert element appears (convenience function)
 * Combines common wait + assertion pattern
 * 
 * @example
 * const dialog = await waitForElement(page.getByRole('dialog'));
 */
export async function waitForElement(locator: Locator, timeout: number = 5000): Promise<Locator> {
  await expect(locator).toBeVisible({ timeout });
  return locator;
}

/**
 * Assert multiple elements are visible
 * Useful for testing that a set of UI elements are rendered
 * 
 * @example
 * await expectAllVisible([
 *   page.getByRole('heading', { name: 'My Plants' }),
 *   page.getByRole('button', { name: 'Add Plant' }),
 *   page.getByTestId('plant-grid')
 * ]);
 */
export async function expectAllVisible(locators: Locator[]) {
  await Promise.all(locators.map(locator => expect(locator).toBeVisible({ timeout: 5000 })));
}

/**
 * Assert at least one of the elements is visible
 * Useful when UI can show different states
 * 
 * @example
 * await expectOneVisible([plantCards, emptyState]);
 */
export async function expectOneVisible(locators: Locator[]) {
  const results = await Promise.all(
    locators.map(locator => locator.isVisible({ timeout: 3000 }).catch(() => false))
  );
  
  if (!results.some(visible => visible)) {
    throw new Error('Expected at least one element to be visible');
  }
}

