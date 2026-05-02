import { test, expect } from '@playwright/test';

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Discover Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });
  });

  test('should display page header and all main sections', async ({ page }) => {
    // Page header
    await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
    await expect(page.getByText('Curated plant care articles')).toBeVisible();

    // Soft assertions for sections — check all even if one is missing
    await expect.soft(page.getByTestId('seasonal-section')).toBeVisible();
    await expect.soft(page.getByTestId('seasonal-section').getByRole('heading')).toContainText('Plant Care');

    await expect.soft(page.getByTestId('general-section')).toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Plant Care Tips' })).toBeVisible();

    await expect.soft(page.getByTestId('browse-by-plant-section')).toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Browse by Plant' })).toBeVisible();
  });

  test('should display blog post cards in seasonal section', async ({ page }) => {
    // Wait for seasonal posts to load (skeletons disappear, cards appear)
    const seasonalSection = page.getByTestId('seasonal-section').locator('..');
    await expect(
      seasonalSection.getByTestId('blog-post-card').first()
    ).toBeVisible({ timeout: 15000 });

    // Each card should have a title link and source name
    const firstCard = seasonalSection.getByTestId('blog-post-card').first();
    await expect(firstCard.getByRole('link')).toBeVisible();
    await expect(firstCard.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  test('should display blog post cards in general section', async ({ page }) => {
    const generalSection = page.getByTestId('general-section').locator('..');
    await expect(
      generalSection.getByTestId('blog-post-card').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should display plant chips in Browse by Plant', async ({ page }) => {
    const chips = page.getByTestId('plant-chips');
    await expect(chips).toBeVisible();

    // Popular plants should appear as clickable chips
    // POPULAR_PLANTS includes 'Monstera', 'Pothos', etc.
    await expect(chips.getByText('Monstera')).toBeVisible({ timeout: 10000 });
    await expect(chips.getByText('Pothos')).toBeVisible();
  });

  test('should search for a plant and show results', async ({ page }) => {
    const searchInput = page.getByTestId('plant-search-input');
    await expect(searchInput).toBeVisible();

    // Type a common plant name
    await searchInput.fill('Monstera');

    // Wait for debounce + results
    const browseSection = page.getByTestId('browse-by-plant-section');
    await expect(
      browseSection.getByTestId('blog-post-card').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should show no-results message for unknown plant', async ({ page }) => {
    const searchInput = page.getByTestId('plant-search-input');
    await searchInput.fill('xyznonexistentplant123');

    // Wait for debounce + query to complete
    const browseSection = page.getByTestId('browse-by-plant-section');
    await expect(
      browseSection.getByText('No articles found')
    ).toBeVisible({ timeout: 15000 });
  });

  test('should toggle chip search on click', async ({ page }) => {
    const chips = page.getByTestId('plant-chips');
    // Use exact match to avoid substring collisions (e.g. "Monstera" matching "Monstera Deliciosa")
    const testChip = chips.getByText('Pothos', { exact: true });
    await expect(testChip).toBeVisible({ timeout: 10000 });

    // Click chip to activate search
    await testChip.click();

    // Search input should be populated with the chip's plant name
    const searchInput = page.getByTestId('plant-search-input');
    await expect(searchInput).toHaveValue('Pothos');

    // Click same chip again to deactivate
    await testChip.click();
    await expect(searchInput).toHaveValue('');
  });

  test('should navigate to Discover via nav button', async ({ page }) => {
    // Start from dashboard
    await page.goto('/');
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

    // Click Discover nav button
    await page.getByTestId('nav-discover-button').click();

    // Verify navigation
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByTestId('discover-page')).toBeVisible({ timeout: 15000 });
  });

  test('should open blog post link in new tab', async ({ page }) => {
    // Wait for any blog post card to load
    const firstCard = page.getByTestId('blog-post-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    // Verify the link has correct attributes
    const link = firstCard.getByRole('link');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);
  });
});
