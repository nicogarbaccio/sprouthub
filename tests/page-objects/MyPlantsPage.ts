import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { BasePage } from './BasePage';

export class MyPlantsPage extends BasePage {
  
  // Main elements
  readonly myPlantsSection: Locator;
  readonly addPlantButton: Locator;
  readonly emptyState: Locator;
  readonly plantCards: Locator;
  
  // Plant management
  readonly waterButtons: Locator;
  readonly postponeButtons: Locator;
  readonly editButtons: Locator;
  readonly historyButtons: Locator;
  
  // Room sections
  readonly roomSections: Locator;
  readonly roomHeaders: Locator;
  
  // Overwatering indicators
  readonly overwateringIndicators: Locator;
  readonly overwateringTooltips: Locator;
  
  // Plant dialogs
  readonly editPlantDialog: Locator;
  readonly wateringHistoryDialog: Locator;
  readonly addPlantDialog: Locator;

  // Watering record elements (within edit dialog)
  readonly wateringHistoryTab: Locator;
  readonly wateringRecordsList: Locator;
  readonly wateringRecordItems: Locator;
  readonly deleteWateringButtons: Locator;
  readonly addWateringButton: Locator;
  
  // Status indicators
  readonly overdueIndicators: Locator;
  readonly nextWateringDates: Locator;

  constructor(page: Page) {
    super(page);
    
    // Main elements
    this.myPlantsSection = page.getByTestId('my-plants-section');
    this.addPlantButton = page.getByRole('button', { name: /add.*plant/i });
    this.emptyState = page.getByTestId('empty-state');
    this.plantCards = page.getByTestId('plant-card');
    
    // Plant management
    this.waterButtons = page.getByRole('button', { name: /water/i });
    this.postponeButtons = page.getByRole('button', { name: /postpone/i });
    this.editButtons = page.getByRole('button', { name: /edit/i });
    this.historyButtons = page.getByRole('button', { name: /history/i });
    
    // Room sections
    this.roomSections = page.getByTestId('room-section');
    this.roomHeaders = page.getByTestId('room-header');
    
    // Overwatering indicators
    this.overwateringIndicators = page.getByTestId('overwatering-indicator');
    this.overwateringTooltips = page.getByRole('tooltip');
    
    // Plant dialogs
    this.editPlantDialog = page.getByRole('dialog', { name: /edit.*plant/i });
    this.wateringHistoryDialog = page.getByRole('dialog', { name: /watering.*history/i });
    this.addPlantDialog = page.getByRole('dialog', { name: /add.*plant/i });

    // Watering record elements (within edit dialog)
    this.wateringHistoryTab = page.getByRole('tab', { name: /watering.*history/i });
    this.wateringRecordsList = page.getByTestId('watering-records-list');
    this.wateringRecordItems = page.locator('[data-testid^="watering-record-"]');
    this.deleteWateringButtons = page.locator('[data-testid^="delete-watering-"]');
    this.addWateringButton = page.getByTestId('add-watering-button');
    
    // Status indicators
    this.overdueIndicators = page.getByTestId('overdue-indicator');
    this.nextWateringDates = page.getByTestId('next-watering-date');
  }

  async goto() {
    await super.goto('/my-plants');
    await this.waitForPageReady();
  }

  async clickAddPlant() {
    // Use first() to handle multiple add plant buttons
    await this.clickElement(this.addPlantButton.first());
    await this.waitForDialogOpen(this.addPlantDialog);
  }

  async waterPlant(plantIndex: number = 0) {
    const waterButton = this.waterButtons.nth(plantIndex);
    await this.clickElement(waterButton);
    await this.page.waitForTimeout(TIMEOUTS.WATERING); // Wait for watering to complete
  }

  async postponeWatering(plantIndex: number = 0) {
    const postponeButton = this.postponeButtons.nth(plantIndex);
    await this.clickElement(postponeButton);
    await this.page.waitForTimeout(TIMEOUTS.WATERING);
  }

  async editPlant(plantIndex: number = 0) {
    const editButton = this.editButtons.nth(plantIndex);
    await this.clickElement(editButton);
    await this.waitForDialogOpen(this.editPlantDialog);
  }

  async viewHistory(plantIndex: number = 0) {
    const historyButton = this.historyButtons.nth(plantIndex);
    await this.clickElement(historyButton);
    await this.waitForDialogOpen(this.wateringHistoryDialog);
  }

  async closeEditDialog() {
    await this.closeDialog(this.editPlantDialog);
  }

  async closeHistoryDialog() {
    await this.closeDialog(this.wateringHistoryDialog);
  }

  async closeAddPlantDialog() {
    await this.closeDialog(this.addPlantDialog);
  }

  async hoverOverwateringIndicator(plantIndex: number = 0) {
    const indicator = this.overwateringIndicators.nth(plantIndex);
    await this.hoverElement(indicator);
  }

  async getPlantCount() {
    return await this.plantCards.count();
  }

  async getRoomCount() {
    return await this.roomSections.count();
  }

  async getOverwateringCount() {
    return await this.overwateringIndicators.count();
  }

  async getOverdueCount() {
    return await this.overdueIndicators.count();
  }

  async expectEmptyState() {
    await this.expectVisible(this.emptyState);
    await expect(this.plantCards).toHaveCount(0);
  }

  async expectPlantsVisible() {
    await this.expectVisible(this.plantCards.first());
    await this.expectHidden(this.emptyState);
  }

  async expectPlantCount(expectedCount: number) {
    const actualCount = await this.getPlantCount();
    expect(actualCount).toBe(expectedCount);
  }

  async expectRoomGrouping() {
    const roomCount = await this.getRoomCount();
    expect(roomCount).toBeGreaterThan(0);
  }

  async expectOverwateringIndicatorVisible(plantIndex: number = 0) {
    const indicator = this.overwateringIndicators.nth(plantIndex);
    await expect(indicator).toBeVisible();
  }

  async expectOverwateringTooltipVisible() {
    await expect(this.overwateringTooltips).toBeVisible();
  }

  async expectOverdueIndicatorVisible(plantIndex: number = 0) {
    const indicator = this.overdueIndicators.nth(plantIndex);
    await expect(indicator).toBeVisible();
  }

  async expectNextWateringDateVisible(plantIndex: number = 0) {
    const dateElement = this.nextWateringDates.nth(plantIndex);
    await expect(dateElement).toBeVisible();
  }

  async expectWaterButtonVisible(plantIndex: number = 0) {
    const waterButton = this.waterButtons.nth(plantIndex);
    await expect(waterButton).toBeVisible();
  }

  async expectPostponeButtonVisible(plantIndex: number = 0) {
    const postponeButton = this.postponeButtons.nth(plantIndex);
    await expect(postponeButton).toBeVisible();
  }

  async expectEditButtonVisible(plantIndex: number = 0) {
    const editButton = this.editButtons.nth(plantIndex);
    await expect(editButton).toBeVisible();
  }

  async expectHistoryButtonVisible(plantIndex: number = 0) {
    const historyButton = this.historyButtons.nth(plantIndex);
    await expect(historyButton).toBeVisible();
  }

  async expectAddPlantDialogVisible() {
    await expect(this.addPlantDialog).toBeVisible();
  }

  async expectAddPlantDialogHidden() {
    await expect(this.addPlantDialog).toBeHidden();
  }

  async expectEditPlantDialogVisible() {
    await expect(this.editPlantDialog).toBeVisible();
  }

  async expectEditPlantDialogHidden() {
    await expect(this.editPlantDialog).toBeHidden();
  }

  async expectWateringHistoryDialogVisible() {
    await expect(this.wateringHistoryDialog).toBeVisible();
  }

  async expectWateringHistoryDialogHidden() {
    await expect(this.wateringHistoryDialog).toBeHidden();
  }

  async expectPlantInRoom(plantName: string, roomName: string) {
    const roomSection = this.roomSections.filter({ hasText: roomName });
    const plantCard = roomSection.getByTestId('plant-card').filter({ hasText: plantName });
    await expect(plantCard).toBeVisible();
  }

  async expectSuccessToast() {
    return await super.expectSuccessToast();
  }

  async expectErrorToast() {
    return await super.expectErrorToast();
  }

  // Watering record management methods
  async openWateringHistoryTab() {
    await this.clickElement(this.wateringHistoryTab);
    await this.expectVisible(this.wateringRecordsList);
  }

  async waitForWateringRecordsToLoad() {
    await this.expectVisible(this.wateringRecordsList);
    // Wait for any loading states to complete
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  async deleteWateringRecord(recordIndex: number = 0) {
    const deleteButton = this.deleteWateringButtons.nth(recordIndex);
    await this.clickElement(deleteButton);
  }

  async deleteWateringRecordById(recordId: string) {
    const deleteButton = this.page.getByTestId(`delete-watering-${recordId}`);
    await this.clickElement(deleteButton);
  }

  async expectWateringRecordLoadingState(recordIndex: number = 0) {
    const deleteButton = this.deleteWateringButtons.nth(recordIndex);

    // Check that button shows loading state (disabled with loading text)
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText(/deleting/i);
  }

  async expectWateringRecordLoadingStateById(recordId: string) {
    const deleteButton = this.page.getByTestId(`delete-watering-${recordId}`);

    // Check that button shows loading state (disabled with loading text)
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toContainText(/deleting/i);
  }

  async expectWateringRecordDeleted(recordId: string) {
    const recordElement = this.page.getByTestId(`watering-record-${recordId}`);
    await expect(recordElement).toBeHidden();
  }

  async expectWateringRecordVisible(recordId: string) {
    const recordElement = this.page.getByTestId(`watering-record-${recordId}`);
    await expect(recordElement).toBeVisible();
  }

  async getWateringRecordCount() {
    return await this.wateringRecordItems.count();
  }

  async expectWateringRecordCount(expectedCount: number) {
    const actualCount = await this.getWateringRecordCount();
    expect(actualCount).toBe(expectedCount);
  }

  async expectNoWateringRecords() {
    const noRecordsMessage = this.page.getByText(/no watering records yet/i);
    await expect(noRecordsMessage).toBeVisible();
  }

  async expectMultipleRecordsCannotBeDeletedSimultaneously(recordId1: string, recordId2: string) {
    // Start deleting first record
    const deleteButton1 = this.page.getByTestId(`delete-watering-${recordId1}`);
    await this.clickElement(deleteButton1);

    // Verify first record is in loading state
    await this.expectWateringRecordLoadingStateById(recordId1);

    // Try to delete second record - button should still be enabled
    const deleteButton2 = this.page.getByTestId(`delete-watering-${recordId2}`);
    await expect(deleteButton2).toBeEnabled();

    // But the first record should not allow additional clicks
    await expect(deleteButton1).toBeDisabled();
  }

  // Method to track operation order for race condition testing
  async trackOperationOrder(): Promise<string[]> {
    const operations: string[] = [];

    // Listen for network requests to track API calls
    this.page.on('request', (request) => {
      const url = request.url();
      if (url.includes('watering_records')) {
        if (request.method() === 'DELETE') {
          operations.push('delete-start');
        } else if (request.method() === 'GET') {
          operations.push('refresh-start');
        }
      }
    });

    this.page.on('response', (response) => {
      const url = response.url();
      if (url.includes('watering_records')) {
        if (response.request().method() === 'DELETE') {
          operations.push('delete-complete');
        } else if (response.request().method() === 'GET') {
          operations.push('refresh-complete');
        }
      }
    });

    return operations;
  }

  async expectSuccessToastAfterRefresh() {
    // Wait for both the data refresh and toast to appear
    await this.expectSuccessToast();

    // Verify that the toast appears after a short delay (indicating refresh completed first)
    await this.page.waitForTimeout(TIMEOUTS.SHORT);
  }

  async expectOperationOrder(expectedOrder: string[], actualOrder: string[]) {
    // Verify that operations occurred in the expected sequence
    for (let i = 0; i < expectedOrder.length; i++) {
      const expected = expectedOrder[i];
      const actual = actualOrder[i];

      if (actual !== expected) {
        throw new Error(`Operation order mismatch at index ${i}. Expected: ${expected}, Got: ${actual}. Full order - Expected: [${expectedOrder.join(', ')}], Actual: [${actualOrder.join(', ')}]`);
      }
    }

    expect(actualOrder.length).toBeGreaterThanOrEqual(expectedOrder.length);
  }
}
