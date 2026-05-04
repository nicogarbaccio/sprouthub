import { test, expect } from '@playwright/test';
import { getToast, deleteAllHiddenForUser } from './helpers';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;

test.use({ storageState: 'e2e/.auth/user.json' });

/**
 * Find the first blog post card that has a "Hide article" button.
 * Cards that are saved won't have the hide button, so this also
 * implicitly finds an unsaved card.
 */
function findHideableCard(page: import('@playwright/test').Page) {
  return page
    .getByTestId('blog-post-card')
    .filter({ has: page.getByLabel('Hide article') })
    .first();
}

test.describe.serial('Hidden Articles', () => {
  test.beforeAll(async () => {
    await deleteAllHiddenForUser(TEST_EMAIL);
  });

  test.afterAll(async () => {
    await deleteAllHiddenForUser(TEST_EMAIL);
  });

  test('should hide an article and verify it disappears', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });

    const card = findHideableCard(page);
    await expect(card).toBeVisible({ timeout: 15000 });

    // Capture the article title before hiding
    const articleTitle = await card.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    // Hide the article
    await card.getByLabel('Hide article').click();

    // Toast with Undo action should appear
    await expect(getToast(page, 'Article hidden')).toBeVisible({ timeout: 10000 });

    // The card should no longer be visible on the page
    await expect(
      page.getByTestId('blog-post-card').filter({ hasText: articleTitle! })
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('should undo hiding and restore the article', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });

    const card = findHideableCard(page);
    await expect(card).toBeVisible({ timeout: 15000 });

    const articleTitle = await card.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    // Hide the article
    await card.getByLabel('Hide article').click();
    const toast = getToast(page, 'Article hidden');
    await expect(toast).toBeVisible({ timeout: 10000 });

    // Click Undo on the toast
    await toast.getByRole('button', { name: 'Undo' }).click();

    // "Article restored" toast should appear
    await expect(getToast(page, 'Article restored')).toBeVisible({ timeout: 10000 });

    // The article should be back on the page
    await expect(
      page.getByTestId('blog-post-card').filter({ hasText: articleTitle! })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should not show hide button on saved articles', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });

    const hideableCard = findHideableCard(page);
    await expect(hideableCard).toBeVisible({ timeout: 15000 });

    // Capture the title so we can re-locate the same card after saving
    const articleTitle = await hideableCard.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    // Use a stable locator based on title text
    const card = page.getByTestId('blog-post-card').filter({ hasText: articleTitle! }).first();

    // Hide button is visible before saving
    await expect(card.getByLabel('Hide article')).toBeVisible();

    // Save the article
    await card.getByLabel('Save article').click();
    await expect(getToast(page, 'Article saved')).toBeVisible({ timeout: 10000 });

    // Hide button should no longer be visible on the saved card
    await expect(card.getByLabel('Hide article')).not.toBeVisible({ timeout: 5000 });

    // Cleanup: unsave the article
    await card.getByLabel('Unsave article').click();
    await expect(getToast(page, 'Article removed from saved')).toBeVisible({ timeout: 10000 });
  });

  test('should restore a hidden article from Settings', async ({ page }) => {
    // Hide an article from Discover
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });

    const card = findHideableCard(page);
    await expect(card).toBeVisible({ timeout: 15000 });

    const articleTitle = await card.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    await card.getByLabel('Hide article').click();
    await expect(getToast(page, 'Article hidden')).toBeVisible({ timeout: 10000 });

    // Navigate to Settings > Preferences
    await page.goto('/settings');
    await page.getByRole('tab', { name: /Preferences/i }).click();

    // The Hidden Articles card should be visible
    await expect(page.getByText('Hidden Articles')).toBeVisible({ timeout: 10000 });

    // The hidden article's title should appear in the list
    await expect(page.getByText(articleTitle!)).toBeVisible({ timeout: 10000 });

    // Click Restore next to the article
    const articleRow = page.locator('li').filter({ hasText: articleTitle! });
    await articleRow.getByRole('button', { name: /Restore/i }).click();

    // Toast confirming restoration
    await expect(getToast(page, 'Article restored')).toBeVisible({ timeout: 10000 });

    // The article should no longer appear in the hidden list
    await expect(articleRow).not.toBeVisible({ timeout: 10000 });
  });
});
