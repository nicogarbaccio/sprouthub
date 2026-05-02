import { test, expect } from '@playwright/test';
import { getToast } from './helpers';

test.use({ storageState: 'e2e/.auth/user.json' });

/**
 * Find the first blog post card on the page that has a "Save article" button
 * (i.e. not already saved). Returns the card locator.
 */
function findUnsavedCard(page: import('@playwright/test').Page) {
  return page
    .getByTestId('blog-post-card')
    .filter({ has: page.getByLabel('Save article') })
    .first();
}

test.describe.serial('Saved Articles', () => {
  // Clean up any leftover saved articles from previous test runs
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({
      storageState: 'e2e/.auth/user.json',
    });
    await page.goto('/my-articles');
    await expect(page.getByTestId('my-articles-page')).toBeVisible({ timeout: 15000 });

    // Wait for content to settle (either cards or empty state)
    await page.waitForTimeout(2000);

    // Unsave all articles if any exist
    const unsaveButtons = page.getByLabel('Unsave article');
    let count = await unsaveButtons.count();
    while (count > 0) {
      await unsaveButtons.first().click();
      // Use .first() to avoid strict mode violation when multiple toasts stack
      await expect(getToast(page, 'Article removed from saved').first()).toBeVisible({ timeout: 10000 });
      // Wait for toast to dismiss and card to be removed
      await page.waitForTimeout(1000);
      count = await unsaveButtons.count();
    }

    await page.close();
  });

  test('should save an article and see it on My Articles', async ({ page }) => {
    // Navigate to Discover and wait for cards to load
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });
    const card = findUnsavedCard(page);
    await expect(card).toBeVisible({ timeout: 15000 });

    // Grab the article title before saving
    const articleTitle = await card.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    // Click save button
    await card.getByLabel('Save article').click();
    await expect(getToast(page, 'Article saved')).toBeVisible({ timeout: 10000 });

    // Navigate to My Articles and verify the article is there
    await page.goto('/my-articles');
    await expect(page.getByTestId('my-articles-page')).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByTestId('blog-post-card').filter({ hasText: articleTitle! })
    ).toBeVisible({ timeout: 15000 });

    // Cleanup: unsave the article
    await page
      .getByTestId('blog-post-card')
      .filter({ hasText: articleTitle! })
      .getByLabel('Unsave article')
      .click();
    await expect(getToast(page, 'Article removed from saved')).toBeVisible({ timeout: 10000 });
  });

  test('should unsave from My Articles and verify removal', async ({ page }) => {
    // First, save an article from Discover
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });
    const card = findUnsavedCard(page);
    await expect(card).toBeVisible({ timeout: 15000 });

    const articleTitle = await card.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    await card.getByLabel('Save article').click();
    await expect(getToast(page, 'Article saved')).toBeVisible({ timeout: 10000 });

    // Navigate to My Articles
    await page.goto('/my-articles');
    await expect(page.getByTestId('my-articles-page')).toBeVisible({ timeout: 15000 });

    const savedCard = page.getByTestId('blog-post-card').filter({ hasText: articleTitle! });
    await expect(savedCard).toBeVisible({ timeout: 15000 });

    // Unsave it
    await savedCard.getByLabel('Unsave article').click();
    await expect(getToast(page, 'Article removed from saved')).toBeVisible({ timeout: 10000 });

    // Card should be gone from My Articles
    await expect(savedCard).not.toBeVisible({ timeout: 10000 });

    // Go back to Discover and verify the icon is back to "Save article"
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });
    const sameCard = page.getByTestId('blog-post-card').filter({ hasText: articleTitle! });
    await expect(sameCard).toBeVisible({ timeout: 15000 });
    await expect(sameCard.getByLabel('Save article')).toBeVisible();
  });

  test('should toggle save/unsave icon on card', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });
    const card = findUnsavedCard(page);
    await expect(card).toBeVisible({ timeout: 15000 });

    // Initially unsaved
    await expect(card.getByLabel('Save article')).toBeVisible();

    // Save -> icon changes
    await card.getByLabel('Save article').click();
    await expect(card.getByLabel('Unsave article')).toBeVisible({ timeout: 5000 });
    await expect(getToast(page, 'Article saved')).toBeVisible({ timeout: 10000 });

    // Unsave -> icon changes back
    await card.getByLabel('Unsave article').click();
    await expect(card.getByLabel('Save article')).toBeVisible({ timeout: 5000 });
    await expect(getToast(page, 'Article removed from saved')).toBeVisible({ timeout: 10000 });
  });

  test('should show matching plant pills on My Articles', async ({ page }) => {
    // Go to dashboard where "For Your Plants" section lives
    await page.goto('/');
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

    const plantSection = page.getByTestId('my-plants-blog-section');

    // Wait for dashboard content to load, then check if section exists
    await page.waitForTimeout(3000);
    const sectionVisible = await plantSection.isVisible().catch(() => false);
    if (!sectionVisible) {
      test.skip(true, 'No "For Your Plants" section — user has no plants');
      return;
    }

    // Find the first card that has plant pills and is unsaved
    const card = plantSection
      .getByTestId('blog-post-card')
      .filter({ has: page.getByLabel('Save article') })
      .first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // Read the plant pill texts from the card
    const pillContainer = card.locator('.absolute.bottom-2');
    const pillTexts = await pillContainer.locator('[class*="inline-flex"]').allTextContents();

    // Filter out "+N" overflow badges (e.g. "+5")
    const plantNames = pillTexts.filter((t) => !t.startsWith('+'));
    expect(plantNames.length).toBeGreaterThan(0);

    // Grab the article title
    const articleTitle = await card.getByRole('link').textContent();
    expect(articleTitle).toBeTruthy();

    // Save the article
    await card.getByLabel('Save article').click();
    await expect(getToast(page, 'Article saved')).toBeVisible({ timeout: 10000 });

    // Navigate to My Articles
    await page.goto('/my-articles');
    await expect(page.getByTestId('my-articles-page')).toBeVisible({ timeout: 15000 });

    // Find the same card
    const savedCard = page.getByTestId('blog-post-card').filter({ hasText: articleTitle! });
    await expect(savedCard).toBeVisible({ timeout: 15000 });

    // Verify the same plant pills appear
    for (const name of plantNames) {
      await expect(savedCard.getByText(name, { exact: true })).toBeVisible();
    }

    // Cleanup: unsave the article
    await savedCard.getByLabel('Unsave article').click();
    await expect(getToast(page, 'Article removed from saved')).toBeVisible({ timeout: 10000 });
  });
});
