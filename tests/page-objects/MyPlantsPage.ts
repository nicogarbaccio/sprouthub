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
    
    // Status indicators
    this.overdueIndicators = page.getByTestId('overdue-indicator');
    this.nextWateringDates = page.getByTestId('next-watering-date');
  }

  async goto() {
    await super.goto('/my-plants');
    await this.waitForPageReady();
  }

  async clickAddPlant() {
    await this.clickElement(this.addPlantButton);
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
}
