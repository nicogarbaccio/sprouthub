import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { BasePage } from './BasePage';

export class PlantDetailsPage extends BasePage {
  
  // Main elements
  readonly plantImage: Locator;
  readonly plantName: Locator;
  readonly botanicalName: Locator;
  readonly plantInfo: Locator;
  
  // Action buttons
  readonly addToCollectionButton: Locator;
  readonly signInToAddButton: Locator;
  readonly backButton: Locator;
  
  // Plant details sections
  readonly wateringInfo: Locator;
  readonly lightInfo: Locator;
  readonly careLevelInfo: Locator;
  readonly categoryInfo: Locator;
  
  // Image modal
  readonly imageModal: Locator;
  readonly imageModalClose: Locator;
  
  // Add plant dialog
  readonly addPlantDialog: Locator;
  readonly addPlantDialogClose: Locator;

  constructor(page: Page) {
    super(page);
    
    // Main elements - using data-testids for reliable targeting
    this.plantImage = page.getByTestId('plant-image');
    this.plantName = page.getByTestId('plant-name');
    this.botanicalName = page.getByTestId('botanical-name');
    this.plantInfo = page.locator('main'); // Main content area
    
    // Action buttons
    this.addToCollectionButton = page.getByTestId('add-to-collection-button');
    this.signInToAddButton = page.getByTestId('sign-in-to-add-button');
    this.backButton = page.getByTestId('back-to-catalog-button');
    
    // Plant details sections - using text content selectors
    this.wateringInfo = page.locator('text=Watering').locator('..');
    this.lightInfo = page.locator('text=Light').locator('..');
    this.careLevelInfo = page.locator('text=Hard, Easy, Medium').first();
    this.categoryInfo = page.locator('text=Indoor, Outdoor').first();
    
    // Image modal
    this.imageModal = page.getByRole('dialog', { name: /image|photo/i });
    this.imageModalClose = page.getByRole('button', { name: /close/i });
    
    // Add plant dialog
    this.addPlantDialog = page.getByRole('dialog', { name: /add.*plant/i });
    this.addPlantDialogClose = page.getByRole('button', { name: /close/i });
  }

  async goto(plantName?: string) {
    if (plantName) {
      const encodedName = plantName.toLowerCase().replace(/\s+/g, '-');
      await super.goto(`/plant/${encodedName}`);
      await this.waitForPageReady();
    }
  }

  async clickAddToCollection() {
    await this.clickElement(this.addToCollectionButton);
    await this.waitForDialogOpen(this.addPlantDialog);
  }

  async clickSignInToAdd() {
    await this.clickElement(this.signInToAddButton);
  }

  async clickPlantImage() {
    await this.clickElement(this.plantImage);
    await this.waitForDialogOpen(this.imageModal, TIMEOUTS.MODAL_TRANSITION);
  }

  async closeImageModal() {
    await this.closeDialog(this.imageModal);
  }

  async closeAddPlantDialog() {
    await this.closeDialog(this.addPlantDialog);
  }

  async goBack() {
    await this.clickElement(this.backButton);
  }

  async expectPlantName(expectedName: string) {
    await this.expectText(this.plantName, expectedName);
  }

  async expectBotanicalName(expectedName: string) {
    await this.expectText(this.botanicalName, expectedName);
  }

  async expectWateringInfo(expectedInfo: string) {
    await expect(this.wateringInfo).toContainText(expectedInfo);
  }

  async expectLightInfo(expectedInfo: string) {
    await expect(this.lightInfo).toContainText(expectedInfo);
  }

  async expectCareLevelInfo(expectedInfo: string) {
    await expect(this.careLevelInfo).toContainText(expectedInfo);
  }

  async expectCategoryInfo(expectedInfo: string) {
    await expect(this.categoryInfo).toContainText(expectedInfo);
  }

  async expectAddToCollectionButtonVisible() {
    await this.expectVisible(this.addToCollectionButton);
  }

  async expectSignInToAddButtonVisible() {
    await this.expectVisible(this.signInToAddButton);
  }

  async expectImageModalVisible() {
    await this.expectVisible(this.imageModal);
  }

  async expectImageModalHidden() {
    await this.expectHidden(this.imageModal);
  }

  async expectAddPlantDialogVisible() {
    await this.expectVisible(this.addPlantDialog);
  }

  async expectAddPlantDialogHidden() {
    await this.expectHidden(this.addPlantDialog);
  }

  async expectPlantImageVisible() {
    await this.expectVisible(this.plantImage);
  }

  async expectPlantInfoVisible() {
    await this.expectVisible(this.plantInfo);
  }

  async expectRedirectToAuth() {
    await super.expectRedirectToAuth();
  }

  async expectRedirectWithReturnUrl() {
    await super.expectRedirectWithReturnUrl();
  }
}
