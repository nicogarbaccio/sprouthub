import { Page, Locator, expect } from '@playwright/test';

export class AddPlantDialogPage {
  readonly page: Page;
  
  // Dialog elements
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly closeButton: Locator;
  
  // Form fields
  readonly nicknameInput: Locator;
  readonly plantTypeSelect: Locator;
  readonly roomSelect: Locator;
  readonly imageUpload: Locator;
  readonly outdoorToggle: Locator;
  
  // Smart watering elements
  readonly smartWateringButton: Locator;
  readonly smartWateringWizard: Locator;
  readonly suggestedWateringDays: Locator;
  
  // Action buttons
  readonly addPlantButton: Locator;
  readonly cancelButton: Locator;
  
  // Validation elements
  readonly validationErrors: Locator;
  readonly requiredFieldIndicators: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Dialog elements
    this.dialog = page.getByRole('dialog', { name: /add.*plant/i });
    this.dialogTitle = page.getByTestId('dialog-title');
    this.closeButton = page.getByRole('button', { name: /close/i });
    
    // Form fields
    this.nicknameInput = page.getByTestId('nickname-input');
    this.plantTypeSelect = page.getByTestId('plant-type-select');
    this.roomSelect = page.getByTestId('room-select');
    this.imageUpload = page.getByTestId('image-upload');
    this.outdoorToggle = page.getByTestId('outdoor-toggle');
    
    // Smart watering elements
    this.smartWateringButton = page.getByTestId('smart-watering-button');
    this.smartWateringWizard = page.getByRole('dialog', { name: /smart.*watering/i });
    this.suggestedWateringDays = page.getByTestId('suggested-watering-days');
    
    // Action buttons
    this.addPlantButton = page.getByTestId('add-plant-button');
    this.cancelButton = page.getByTestId('cancel-button');
    
    // Validation elements
    this.validationErrors = page.getByTestId('validation-error');
    this.requiredFieldIndicators = page.locator('[required]');
  }

  async waitForDialog() {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async closeDialog() {
    await this.closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async fillNickname(nickname: string) {
    await this.nicknameInput.fill(nickname);
  }

  async selectPlantType(plantType: string) {
    await this.plantTypeSelect.selectOption(plantType);
  }

  async selectRoom(room: string) {
    await this.roomSelect.selectOption(room);
  }

  async uploadImage(imagePath: string) {
    await this.imageUpload.setInputFiles(imagePath);
  }

  async toggleOutdoor() {
    await this.outdoorToggle.click();
  }

  async clickSmartWatering() {
    await this.smartWateringButton.click();
    await this.smartWateringWizard.waitFor({ state: 'visible' });
  }

  async closeSmartWateringWizard() {
    const closeButton = this.smartWateringWizard.getByRole('button', { name: /close/i });
    await closeButton.click();
    await this.smartWateringWizard.waitFor({ state: 'hidden' });
  }

  async submitForm() {
    await this.addPlantButton.click();
  }

  async cancelForm() {
    await this.cancelButton.click();
  }

  async fillCompleteForm(formData: {
    nickname: string;
    plantType: string;
    room?: string;
    imagePath?: string;
    isOutdoor?: boolean;
  }) {
    await this.fillNickname(formData.nickname);
    await this.selectPlantType(formData.plantType);
    
    if (formData.room) {
      await this.selectRoom(formData.room);
    }
    
    if (formData.imagePath) {
      await this.uploadImage(formData.imagePath);
    }
    
    if (formData.isOutdoor) {
      await this.toggleOutdoor();
    }
  }

  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogHidden() {
    await expect(this.dialog).toBeHidden();
  }

  async expectFormFieldsVisible() {
    await expect(this.nicknameInput).toBeVisible();
    await expect(this.plantTypeSelect).toBeVisible();
    await expect(this.roomSelect).toBeVisible();
  }

  async expectSmartWateringButtonVisible() {
    await expect(this.smartWateringButton).toBeVisible();
  }

  async expectSmartWateringWizardVisible() {
    await expect(this.smartWateringWizard).toBeVisible();
  }

  async expectSmartWateringWizardHidden() {
    await expect(this.smartWateringWizard).toBeHidden();
  }

  async expectAddPlantButtonEnabled() {
    await expect(this.addPlantButton).toBeEnabled();
  }

  async expectAddPlantButtonDisabled() {
    await expect(this.addPlantButton).toBeDisabled();
  }

  async expectValidationError(fieldName: string) {
    const errorElement = this.page.locator(`[data-testid="${fieldName}-error"]`);
    await expect(errorElement).toBeVisible();
  }

  async expectRequiredFieldIndicator(fieldName: string) {
    const field = this.page.getByTestId(`${fieldName}-input`);
    await expect(field).toHaveAttribute('required');
  }

  async expectNicknameValue(expectedValue: string) {
    await expect(this.nicknameInput).toHaveValue(expectedValue);
  }

  async expectPlantTypeValue(expectedValue: string) {
    await expect(this.plantTypeSelect).toHaveValue(expectedValue);
  }

  async expectRoomValue(expectedValue: string) {
    await expect(this.roomSelect).toHaveValue(expectedValue);
  }

  async expectOutdoorToggleChecked() {
    await expect(this.outdoorToggle).toBeChecked();
  }

  async expectOutdoorToggleUnchecked() {
    await expect(this.outdoorToggle).not.toBeChecked();
  }

  async expectSuggestedWateringDays(expectedDays: number) {
    await expect(this.suggestedWateringDays).toContainText(expectedDays.toString());
  }

  async expectSuccessToast() {
    const toast = this.page.locator('[data-testid*="toast"], [role="alert"], .toast').first();
    await expect(toast).toBeVisible();
  }

  async expectErrorToast() {
    const toast = this.page.locator('[data-testid*="toast"], [role="alert"], .toast').first();
    await expect(toast).toBeVisible();
  }

  async expectRedirectToAuth() {
    await this.page.waitForURL('**/auth**');
    expect(this.page.url()).toContain('/auth');
  }

  async expectRedirectWithReturnUrl() {
    await this.page.waitForURL('**/auth**');
    const url = new URL(this.page.url());
    expect(url.searchParams.get('redirect')).toBeTruthy();
  }
}
