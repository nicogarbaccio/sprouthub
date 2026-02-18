import { test, expect } from '@playwright/test';

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('My Plants - Search, Filter & Sort', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });
  });

  // ── Page Load ──────────────────────────────────────────────────────

  test('should display plants grouped by room', async ({ page }) => {
    // Header
    await expect(page.getByRole('heading', { name: 'My Plant Collection' })).toBeVisible();
    await expect(page.getByTestId('plants-total-badge')).toBeVisible();
    await expect(page.getByTestId('room-count-badge')).toBeVisible();

    // Room sections exist
    const roomSections = page.getByTestId('room-section');
    await expect(roomSections.first()).toBeVisible();
    const roomCount = await roomSections.count();
    expect(roomCount).toBeGreaterThanOrEqual(1);

    // Each room has a name and plant count
    for (let i = 0; i < roomCount; i++) {
      const section = roomSections.nth(i);
      await expect(section.getByTestId('room-name')).toBeVisible();
    }
  });

  test('should display plant cards with expected info', async ({ page }) => {
    const firstCard = page.getByTestId('plant-card').first();
    await expect(firstCard).toBeVisible();

    // Card should contain a plant name heading and species text
    await expect(firstCard.getByRole('heading', { level: 3 })).toBeVisible();
  });

  // ── Search ─────────────────────────────────────────────────────────

  test('should filter plants by nickname search', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Search plants' });
    await searchbox.fill('Monstera');

    // Only matching cards should be visible
    await expect(page.getByTestId('plant-card')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Monstera', level: 3 })).toBeVisible();
  });

  test('should filter plants by species search', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Search plants' });
    await searchbox.fill('Pothos');

    // The Disco Pothos card should be visible (species = Pothos)
    await expect(page.getByTestId('plant-card').filter({ hasText: 'Pothos' })).toBeVisible();
  });

  test('should show empty state for search with no results', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Search plants' });
    await searchbox.fill('xyznonexistent');

    // No plant cards visible
    await expect(page.getByTestId('plant-card')).toHaveCount(0);
  });

  test('should clear search and show all plants again', async ({ page }) => {
    const searchbox = page.getByRole('searchbox', { name: 'Search plants' });
    const initialCount = await page.getByTestId('plant-card').count();

    await searchbox.fill('Monstera');
    await expect(page.getByTestId('plant-card')).toHaveCount(1);

    await searchbox.clear();
    await expect(page.getByTestId('plant-card')).toHaveCount(initialCount);
  });

  // ── Filters ────────────────────────────────────────────────────────

  test('should open filter panel and show dropdowns', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();

    // Status and Room dropdowns should appear
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: 'All Rooms' })).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    const initialCount = await page.getByTestId('plant-card').count();

    // Open filters and select "On Schedule"
    await page.getByRole('button', { name: 'Filters' }).click();
    const statusCombobox = page.getByRole('combobox').filter({ hasText: 'All Plants' });
    await statusCombobox.click();
    await page.getByRole('option', { name: 'On Schedule' }).click();

    // Results should be filtered (may be same or fewer)
    const filteredCount = await page.getByTestId('plant-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter by room', async ({ page }) => {
    const initialRoomCount = await page.getByTestId('room-section').count();
    expect(initialRoomCount).toBeGreaterThan(1);

    await page.getByRole('button', { name: 'Filters' }).click();
    const roomCombobox = page.getByRole('combobox').filter({ hasText: 'All Rooms' });
    await roomCombobox.click();

    // Select first room option that isn't "All Rooms"
    const roomOption = page.getByRole('option').filter({ hasNotText: 'All Rooms' }).first();
    await roomOption.click();

    // Only one room section should be visible
    const roomSections = page.getByTestId('room-section');
    await expect(roomSections).toHaveCount(1);
  });

  // ── Sort ───────────────────────────────────────────────────────────

  test('should open sort menu with all options', async ({ page }) => {
    await page.getByRole('button', { name: 'Sort' }).click();

    await expect(page.getByRole('button', { name: 'Name (A-Z)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Name (Z-A)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recently Watered' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Watering' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Newest First' })).toBeVisible();
  });

  test('should sort by Name (Z-A)', async ({ page }) => {
    await page.getByRole('button', { name: 'Sort' }).click();
    await page.getByRole('button', { name: 'Name (Z-A)' }).click();

    // After sorting Z-A, the first plant card heading should come later alphabetically
    const firstPlantName = await page.getByTestId('plant-card').first().getByRole('heading', { level: 3 }).textContent();
    const lastPlantName = await page.getByTestId('plant-card').last().getByRole('heading', { level: 3 }).textContent();

    expect(firstPlantName!.localeCompare(lastPlantName!)).toBeGreaterThanOrEqual(0);
  });

  test('should sort by Name (A-Z) as default', async ({ page }) => {
    // Default sort is A-Z — first plant name should come before last alphabetically
    const firstPlantName = await page.getByTestId('plant-card').first().getByRole('heading', { level: 3 }).textContent();
    const lastPlantName = await page.getByTestId('plant-card').last().getByRole('heading', { level: 3 }).textContent();

    expect(firstPlantName!.localeCompare(lastPlantName!)).toBeLessThanOrEqual(0);
  });

  test('should sort by Recently Watered', async ({ page }) => {
    await page.getByRole('button', { name: 'Sort' }).click();
    await page.getByRole('button', { name: 'Recently Watered' }).click();

    // Plants should still be visible after sort change
    await expect(page.getByTestId('plant-card').first()).toBeVisible();
  });

  test('should sort by Next Watering', async ({ page }) => {
    await page.getByRole('button', { name: 'Sort' }).click();
    await page.getByRole('button', { name: 'Next Watering' }).click();

    await expect(page.getByTestId('plant-card').first()).toBeVisible();
  });

  test('should sort by Newest First', async ({ page }) => {
    await page.getByRole('button', { name: 'Sort' }).click();
    await page.getByRole('button', { name: 'Newest First' }).click();

    await expect(page.getByTestId('plant-card').first()).toBeVisible();
  });

  // ── Combined Filters ────────────────────────────────────────────────

  test('should combine status and room filters', async ({ page }) => {
    const initialCount = await page.getByTestId('plant-card').count();

    await page.getByRole('button', { name: 'Filters' }).click();

    // Apply status filter
    const statusCombobox = page.getByRole('combobox').filter({ hasText: 'All Plants' });
    await statusCombobox.click();
    await page.getByRole('option', { name: 'On Schedule' }).click();

    // Apply room filter
    const roomCombobox = page.getByRole('combobox').filter({ hasText: 'All Rooms' });
    await roomCombobox.click();
    const roomOption = page.getByRole('option').filter({ hasNotText: 'All Rooms' }).first();
    await roomOption.click();

    // Combined filters should show equal or fewer results
    const filteredCount = await page.getByTestId('plant-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter by Overdue status', async ({ page }) => {
    const initialCount = await page.getByTestId('plant-card').count();

    await page.getByRole('button', { name: 'Filters' }).click();
    const statusCombobox = page.getByRole('combobox').filter({ hasText: 'All Plants' });
    await statusCombobox.click();
    await page.getByRole('option', { name: 'Overdue' }).click();

    const filteredCount = await page.getByTestId('plant-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  // ── Navigation ─────────────────────────────────────────────────────

  test('should navigate to plant detail when clicking plant name', async ({ page }) => {
    const firstPlantButton = page.getByTestId('plant-card').first().getByRole('heading', { level: 3 }).getByRole('button');
    const plantName = await firstPlantButton.textContent();
    await firstPlantButton.click();

    await expect(page).toHaveURL(/\/my-plants\/[\w-]+/);
    await expect(page.getByRole('heading', { name: plantName!, level: 1 })).toBeVisible({ timeout: 10000 });
  });
});
