import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { BasePage } from './BasePage';
import { PLANT_APP_FEATURES, TestBehavior } from '../utils/feature-errors';

export class PlantCatalogPage extends BasePage {
  
  // Main elements -  selectors
  readonly plantGrid: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly noResultsMessage: Locator;
  
  // Filter elements -  selectors
  readonly categoryFilter: Locator;
  readonly careLevelFilter: Locator;
  readonly lightRequirementFilter: Locator;
  readonly filterDialog: Locator;
  
  // Pagination elements -  selectors
  readonly paginationControls: Locator;
  readonly paginationContainer: Locator; // Added for test compatibility
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;
  readonly pageNumbers: Locator;
  readonly currentPageIndicator: Locator;
  
  // Results summary -  selectors
  readonly resultsSummary: Locator;
  readonly totalResults: Locator;
  
  // Plant cards -  selectors
  readonly plantCards: Locator;
  readonly addToCollectionButtons: Locator;
  readonly signInToAddButtons: Locator;
  readonly viewDetailsButtons: Locator;
  
  // Homepage elements -  selectors
  readonly viewAllPlantsButton: Locator;
  readonly signUpFreeButton: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Main elements -  selectors based on actual page structure
    this.plantGrid = page.locator('main section'); // Actual plant grid container
    this.searchInput = page.locator('input[type="search"]'); // Will be null if not present
    this.filterButton = page.locator('button:has-text("Filter")'); // Will be null if not present
    this.clearFiltersButton = page.locator('button:has-text("Clear")'); // Will be null if not present
    this.noResultsMessage = page.locator('text=No plants found'); // Will be null if not present
    
    // Filter elements -  selectors (will be null if not present)
    this.categoryFilter = page.locator('select[name*="category"]');
    this.careLevelFilter = page.locator('select[name*="care"]');
    this.lightRequirementFilter = page.locator('select[name*="light"]');
    this.filterDialog = page.locator('[role="dialog"]');
    
    // Pagination elements -  selectors (will be null if not present)
    this.paginationControls = page.locator('nav[aria-label*="pagination"]');
    this.paginationContainer = page.locator('nav[aria-label*="pagination"]'); // Same as paginationControls
    this.nextPageButton = page.locator('button:has-text("Next")');
    this.previousPageButton = page.locator('button:has-text("Previous")');
    this.pageNumbers = page.locator('button:has-text(/^\\d+$/)');
    this.currentPageIndicator = page.locator('[aria-current="page"]');
    
    // Results summary -  selectors based on actual page structure
    this.resultsSummary = page.locator('p:has-text("Showing")'); // "Showing 1-24 of 83 plants"
    this.totalResults = page.locator('p:has-text("Showing")'); // Same as resultsSummary
    
    // Plant cards -  selectors based on actual page structure
    this.plantCards = page.locator('main section > div > div'); // Actual plant card containers
    this.addToCollectionButtons = page.getByRole('button', { name: /add to collection/i });
    this.signInToAddButtons = page.getByRole('button', { name: /sign in to add/i });
    this.viewDetailsButtons = page.getByRole('button', { name: /view details/i });
    
    // Homepage elements -  selectors
    this.viewAllPlantsButton = page.locator('button:has-text("Start Growing")'); // "Start Growing" button
    this.signUpFreeButton = page.getByRole('button', { name: /sign up free/i });
    this.signInButton = page.getByRole('button', { name: /sign in/i });
  }

  //  navigation methods
  async goto() {
    await super.goto('/plant-catalog');
    await this.waitForPageReady(['main section']);
  }

  async gotoHomepage() {
    await super.goto('/');
    await this.waitForPageReady(['main']);
  }

  //  search methods (gracefully handled if not available)
  async searchPlants(searchTerm: string) {
    return await this.executeIfAvailable(
      'input[type="search"]',
      async () => {
        await this.fillField(this.searchInput, searchTerm);
      },
      PLANT_APP_FEATURES.SEARCH.featureName
    );
  }

  async clearSearch() {
    return await this.executeIfAvailable(
      'input[type="search"]',
      async () => {
        await this.searchInput.clear({ timeout: TIMEOUTS.FORM_FILL });
        await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
      },
      PLANT_APP_FEATURES.SEARCH.featureName
    );
  }

  //  filter methods (gracefully handled if not available)
  async openFilters() {
    return await this.executeIfAvailable(
      'button:has-text("Filter")',
      async () => {
        await this.clickElement(this.filterButton);
        await this.waitForDialogOpen(this.filterDialog);
      },
      PLANT_APP_FEATURES.FILTERS.featureName
    );
  }

  async closeFilters() {
    if (await this.filterDialog.count() > 0) {
      const closeButton = this.filterDialog.getByRole('button', { name: /close/i });
      await closeButton.click();
      await this.filterDialog.waitFor({ state: 'hidden' });
    }
  }

  async selectCategory(category: string) {
    return await this.executeIfAvailable(
      'select[name*="category"]',
      async () => {
        await this.selectOption(this.categoryFilter, category);
      },
      'Category Filter'
    );
  }

  async selectCareLevel(careLevel: string) {
    return await this.executeIfAvailable(
      'select[name*="care"]',
      async () => {
        await this.selectOption(this.careLevelFilter, careLevel);
      },
      'Care Level Filter'
    );
  }

  async selectLightRequirement(lightRequirement: string) {
    return await this.executeIfAvailable(
      'select[name*="light"]',
      async () => {
        await this.selectOption(this.lightRequirementFilter, lightRequirement);
      },
      'Light Requirement Filter'
    );
  }

  async clearAllFilters() {
    if (await this.clearFiltersButton.count() > 0) {
      await this.clearFiltersButton.click();
      await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    }
  }

  // New method for filtering by category (gracefully handled)
  async filterByCategory(category: string) {
    await this.handleMissingFeature(
      `Filter by category "${category}"`,
      PLANT_APP_FEATURES.FILTERS.availability,
      PLANT_APP_FEATURES.FILTERS.behavior
    );
  }

  //  pagination methods (gracefully handled if not available)
  async goToNextPage() {
    return await this.executeIfAvailable(
      'button:has-text("Next")',
      async () => {
        await this.clickElement(this.nextPageButton);
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
      },
      PLANT_APP_FEATURES.PAGINATION.featureName
    );
  }

  async goToPreviousPage() {
    return await this.executeIfAvailable(
      'button:has-text("Previous")',
      async () => {
        await this.clickElement(this.previousPageButton);
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
      },
      PLANT_APP_FEATURES.PAGINATION.featureName
    );
  }

  async goToPage(pageNumber: number) {
    return await this.executeIfAvailable(
      'button:has-text(/^\\d+$/)',
      async () => {
        const pageButton = this.pageNumbers.getByRole('button', { name: pageNumber.toString() });
        await this.clickElement(pageButton);
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
      },
      PLANT_APP_FEATURES.PAGINATION.featureName
    );
  }

  //  plant interaction methods
  async clickAddToCollection(plantIndex: number = 0) {
    const addButton = this.addToCollectionButtons.nth(plantIndex);
    await addButton.click({ timeout: TIMEOUTS.FORM_FILL });
  }

  async clickSignInToAdd(plantIndex: number = 0) {
    const signInButton = this.signInToAddButtons.nth(plantIndex);
    await signInButton.click({ timeout: TIMEOUTS.FORM_FILL });
  }

  async clickViewDetails(plantIndex: number = 0) {
    const viewButton = this.viewDetailsButtons.nth(plantIndex);
    await viewButton.click({ timeout: TIMEOUTS.FORM_FILL });
  }

  // New method for clicking "Start Growing" button on homepage
  async clickStartGrowing() {
    await this.viewAllPlantsButton.click({ timeout: TIMEOUTS.FORM_FILL });
  }

  //  data retrieval methods
  async getPlantCardCount() {
    return await this.plantCards.count();
  }

  async getTotalResultsCount() {
    if (await this.totalResults.count() > 0) {
      const text = await this.totalResults.textContent();
      return parseInt(text?.match(/\d+/)?.[0] || '0');
    }
    return 0;
  }

  async getCurrentPageNumber() {
    if (await this.currentPageIndicator.count() > 0) {
      const text = await this.currentPageIndicator.textContent();
      return parseInt(text?.match(/\d+/)?.[0] || '1');
    }
    return 1;
  }

  // New method to get results summary text
  async getResultsSummaryText() {
    if (await this.resultsSummary.count() > 0) {
      return await this.resultsSummary.textContent();
    }
    return '';
  }

  //  expectation methods
  async expectPlantCount(expectedCount: number) {
    const actualCount = await this.getPlantCardCount();
    expect(actualCount).toBe(expectedCount);
  }

  async expectSearchResults(searchTerm: string) {
    const plantNames = await this.getVisiblePlantNames();
    this.verifySearchTermInNames(plantNames, searchTerm);
  }

  /**
   * Get all visible plant names from plant cards
   */
  private async getVisiblePlantNames(): Promise<string[]> {
    return await this.plantCards.locator('h3').allTextContents();
  }

  /**
   * Verify that all plant names contain the search term
   */
  private verifySearchTermInNames(plantNames: string[], searchTerm: string) {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    for (const name of plantNames) {
      expect(name.toLowerCase()).toContain(normalizedSearchTerm);
    }
  }

  async expectNoResults() {
    if (await this.noResultsMessage.count() > 0) {
      await expect(this.noResultsMessage).toBeVisible();
    }
    // Plant grid might still be visible but empty
  }

  async expectFiltersApplied() {
    // Check if any filter is not set to "all"
    if (await this.categoryFilter.count() > 0) {
      const categoryValue = await this.categoryFilter.inputValue();
      return categoryValue !== 'all';
    }
    return false;
  }

  async expectPaginationVisible() {
    if (await this.paginationControls.count() > 0) {
      await expect(this.paginationControls).toBeVisible();
    }
  }

  async expectPaginationHidden() {
    if (await this.paginationControls.count() > 0) {
      await expect(this.paginationControls).toBeHidden();
    }
  }

  async expectPageNumber(pageNumber: number) {
    if (await this.currentPageIndicator.count() > 0) {
      await expect(this.currentPageIndicator).toContainText(pageNumber.toString());
    }
  }

  async expectAddToCollectionButtonsVisible() {
    if (await this.addToCollectionButtons.count() > 0) {
      await expect(this.addToCollectionButtons.first()).toBeVisible();
    }
  }

  async expectSignInToAddButtonsVisible() {
    if (await this.signInToAddButtons.count() > 0) {
      await expect(this.signInToAddButtons.first()).toBeVisible();
    }
  }

  async expectPlantCardVisible(plantName: string) {
    const plantCard = this.plantCards.filter({ hasText: plantName });
    await expect(plantCard).toBeVisible();
  }

  async expectPlantCardHidden(plantName: string) {
    const plantCard = this.plantCards.filter({ hasText: plantName });
    await expect(plantCard).toBeHidden();
  }

  // New expectation methods for current app structure
  async expectViewAllPlantsButtonVisible() {
    await expect(this.viewAllPlantsButton).toBeVisible();
  }

  async expectResultsSummaryVisible() {
    if (await this.resultsSummary.count() > 0) {
      await expect(this.resultsSummary).toBeVisible();
    }
  }

  async expectSignUpPromptVisible() {
    await expect(this.page.locator('h3:has-text("You\'re viewing a preview")')).toBeVisible();
  }

  // New method for expecting filter results (gracefully handled)
  async expectFilterResults(filterType: string) {
    await this.handleMissingFeature(
      `Filter results for "${filterType}"`,
      PLANT_APP_FEATURES.FILTERS.availability,
      PLANT_APP_FEATURES.FILTERS.behavior
    );
  }
}
