import { test, expect, type Page } from '@playwright/test';
import { SEED_PLANTS } from './fixtures';

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

const { onSchedule, overdue, dueToday, household } = SEED_PLANTS;

/** The card for a seeded plant, found by its exact nickname */
function card(page: Page, nickname: string) {
  return page.getByTestId('plant-card').filter({
    has: page.getByRole('heading', { name: nickname, exact: true, level: 3 }),
  });
}

/** Plant names in one room section, top to bottom */
function namesInRoom(page: Page, roomLabel: string) {
  return page
    .getByTestId('room-section')
    .filter({ has: page.getByTestId('room-name').filter({ hasText: roomLabel }) })
    .getByTestId('plant-card')
    .getByRole('heading', { level: 3 })
    .allTextContents();
}

async function chooseStatus(page: Page, label: string) {
  await page.getByRole('combobox').filter({ hasText: 'All Plants' }).click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

async function chooseRoom(page: Page, label: string) {
  await page.getByRole('combobox').filter({ hasText: 'All Rooms' }).click();
  await page.getByRole('option', { name: label }).click();
}

async function chooseSort(page: Page, label: string) {
  await page.getByRole('button', { name: 'Sort' }).click();
  await page.getByRole('button', { name: label }).click();
}

// Search sits behind the header's Search button
async function openSearch(page: Page) {
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  return page.getByRole('searchbox', { name: 'Search plants' });
}

test.describe('My Plants - Search, Filter & Sort', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-plants');
    await expect(page.getByTestId('my-plants-collection')).toBeVisible({ timeout: 15000 });
  });

  // ── Page Load ──────────────────────────────────────────────────────

  test('should display plants grouped by room', async ({ page }) => {
    // Header
    await expect(page.getByRole('heading', { name: 'My Plants' })).toBeVisible();

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
    const searchbox = await openSearch(page);
    await searchbox.fill(onSchedule.nickname);

    await expect(card(page, onSchedule.nickname)).toBeVisible();
    await expect(card(page, overdue.nickname)).toBeHidden();
    await expect(card(page, dueToday.nickname)).toBeHidden();
  });

  test('should filter plants by species search', async ({ page }) => {
    const searchbox = await openSearch(page);
    await searchbox.fill(overdue.plantType);

    await expect(card(page, overdue.nickname)).toBeVisible();
    await expect(card(page, onSchedule.nickname)).toBeHidden();
  });

  test('should show empty state for search with no results', async ({ page }) => {
    const searchbox = await openSearch(page);
    await searchbox.fill('xyznonexistent');

    // No plant cards visible
    await expect(page.getByTestId('plant-card')).toHaveCount(0);
  });

  test('should clear search and show all plants again', async ({ page }) => {
    const searchbox = await openSearch(page);
    await searchbox.fill(onSchedule.nickname);
    await expect(card(page, overdue.nickname)).toBeHidden();

    await searchbox.clear();
    await expect(card(page, overdue.nickname)).toBeVisible();
    await expect(card(page, onSchedule.nickname)).toBeVisible();
  });

  // ── Filters ────────────────────────────────────────────────────────

  test('should open filter panel and show dropdowns', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();

    // Status and Room dropdowns should appear
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByRole('combobox').filter({ hasText: 'All Rooms' })).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();
    await chooseStatus(page, 'On Schedule');

    await expect(card(page, onSchedule.nickname)).toBeVisible();
    await expect(card(page, household.nickname)).toBeVisible();
    await expect(card(page, overdue.nickname)).toBeHidden();
    await expect(card(page, dueToday.nickname)).toBeHidden();
  });

  test('should filter by room', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();
    await chooseRoom(page, dueToday.roomLabel);

    await expect(page.getByTestId('room-section')).toHaveCount(1);
    await expect(card(page, dueToday.nickname)).toBeVisible();
    await expect(card(page, onSchedule.nickname)).toBeHidden();
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

  // The Living Room holds exactly two seeded plants, so each sort has one right order
  test('should sort by Name (Z-A)', async ({ page }) => {
    await chooseSort(page, 'Name (Z-A)');
    await expect.poll(() => namesInRoom(page, onSchedule.roomLabel)).toEqual([onSchedule.nickname, overdue.nickname]);
  });

  test('should sort by Name (A-Z) as default', async ({ page }) => {
    await expect.poll(() => namesInRoom(page, onSchedule.roomLabel)).toEqual([overdue.nickname, onSchedule.nickname]);
  });

  test('should sort by Recently Watered', async ({ page }) => {
    await chooseSort(page, 'Recently Watered');
    await expect.poll(() => namesInRoom(page, onSchedule.roomLabel)).toEqual([onSchedule.nickname, overdue.nickname]);
  });

  test('should sort by Next Watering', async ({ page }) => {
    await chooseSort(page, 'Next Watering');
    await expect.poll(() => namesInRoom(page, onSchedule.roomLabel)).toEqual([overdue.nickname, onSchedule.nickname]);
  });

  test('should sort by Newest First', async ({ page }) => {
    // The seed adds the on-schedule plant before the overdue one
    await chooseSort(page, 'Newest First');
    await expect.poll(() => namesInRoom(page, onSchedule.roomLabel)).toEqual([overdue.nickname, onSchedule.nickname]);
  });

  // ── Combined Filters ────────────────────────────────────────────────

  test('should combine status and room filters', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();
    await chooseStatus(page, 'On Schedule');
    await chooseRoom(page, onSchedule.roomLabel);

    await expect(card(page, onSchedule.nickname)).toBeVisible();
    // Same room but overdue, and on schedule but another room
    await expect(card(page, overdue.nickname)).toBeHidden();
    await expect(card(page, household.nickname)).toBeHidden();
  });

  test('should filter by Overdue status', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();
    await chooseStatus(page, 'Overdue');

    await expect(card(page, overdue.nickname)).toBeVisible();
    await expect(card(page, onSchedule.nickname)).toBeHidden();
    await expect(card(page, dueToday.nickname)).toBeHidden();
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
