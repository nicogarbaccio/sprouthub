import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { FeatureErrorHandler, FeatureAvailability, TestBehavior } from '../utils/feature-errors';

export class SmartWateringPage {
  readonly page: Page;
  readonly wizardDialog: Locator;
  readonly wizardTitle: Locator;
  readonly progressBar: Locator;
  readonly stepIndicators: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly applyButton: Locator;
  readonly closeButton: Locator;

  // Step 1 - Plant Size
  readonly plantSizeOptions: Locator;
  readonly smallPlantOption: Locator;
  readonly mediumPlantOption: Locator;
  readonly largePlantOption: Locator;

  // Step 2 - Environment
  readonly weatherToggle: Locator;

  // Step 3 - Preferences
  readonly careStyleOptions: Locator;
  readonly soilTypeOptions: Locator;
  readonly seasonDisplay: Locator;

  // Step 4 - Results
  readonly recommendedDays: Locator;
  readonly confidenceLevel: Locator;
  readonly adjustmentReasons: Locator;
  readonly weatherDataSection: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main wizard elements
    this.wizardDialog = page.getByRole('dialog', { name: 'Smart Watering Schedule' });
    this.wizardTitle = page.getByTestId('wizard-title');
    this.progressBar = page.getByTestId('progress-bar');
    this.stepIndicators = page.getByTestId('step-indicators');
    this.nextButton = page.getByTestId('next-button');
    this.backButton = page.getByTestId('back-button');
    this.applyButton = page.getByTestId('apply-button');
    this.closeButton = page.getByRole('button', { name: /close|cancel/i });

    // Step 1 - Plant Size
    this.plantSizeOptions = page.locator('[data-testid="plant-size-option"]');
    this.smallPlantOption = page.getByTestId('plant-size-small');
    this.mediumPlantOption = page.getByTestId('plant-size-medium');
    this.largePlantOption = page.getByTestId('plant-size-large');

    // Step 2 - Environment
    this.weatherToggle = page.getByTestId('weather-data-toggle');

    // Step 3 - Preferences
    this.careStyleOptions = page.locator('[data-testid="care-style-option"]');
    this.soilTypeOptions = page.locator('[data-testid="soil-type-option"]');
    this.seasonDisplay = page.getByTestId('season-display');

    // Step 4 - Results
    this.recommendedDays = page.getByTestId('recommended-days');
    this.confidenceLevel = page.getByTestId('confidence-level');
    this.adjustmentReasons = page.getByTestId('adjustment-reasons');
    this.weatherDataSection = page.getByTestId('weather-data-section');
  }

  async openWizard() {
    // First, we need to add a plant to access the smart watering wizard
    // The wizard is only available within the AddPlantDialog
    const addPlantButton = this.page.getByRole('button', { name: /add.*plant/i }).first();
    await addPlantButton.click({ timeout: TIMEOUTS.CLICK });
    
    // Wait for the AddPlantDialog to open
    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: TIMEOUTS.DIALOG_OPEN });
    
    // Find and click the smart watering button within the dialog
    const smartWateringButton = this.page.getByTestId('smart-watering-button');
    await smartWateringButton.click({ timeout: TIMEOUTS.CLICK });
    
    // Wait for the wizard dialog to open
    await this.wizardDialog.waitFor({ state: 'visible', timeout: TIMEOUTS.DIALOG_OPEN });
  }

  async closeWizard() {
    await this.closeButton.click({ timeout: TIMEOUTS.CLICK });
    await this.wizardDialog.waitFor({ state: 'hidden', timeout: TIMEOUTS.DIALOG_CLOSE });
    
    // Also close the AddPlantDialog if it's still open
    const addPlantDialog = this.page.getByRole('dialog', { name: 'Add New Plant' });
    if (await addPlantDialog.isVisible()) {
      const closeAddPlantButton = this.page.getByRole('button', { name: 'Close' }).first();
      await closeAddPlantButton.click({ timeout: TIMEOUTS.CLICK });
      await addPlantDialog.waitFor({ state: 'hidden', timeout: TIMEOUTS.DIALOG_CLOSE });
    }
  }

  async selectPlantSize(size: 'small' | 'medium' | 'large') {
    const option = this.page.getByTestId(`plant-size-${size}`);
    await option.click({ timeout: TIMEOUTS.CLICK });
    await this.page.waitForTimeout(TIMEOUTS.ANIMATION); // Wait for selection animation
  }

  async setLightLevel(level: 'low' | 'medium' | 'high') {
    const option = this.page.getByTestId(`light-level-${level}`);
    await option.click();
  }

  async setTemperature(temp: 'cool' | 'normal' | 'warm') {
    const option = this.page.getByTestId(`temperature-${temp}`);
    await option.click();
  }

  async setHumidity(humidity: 'dry' | 'normal' | 'humid') {
    const option = this.page.getByTestId(`humidity-${humidity}`);
    await option.click();
  }

  async toggleWeatherData() {
    await this.weatherToggle.click();
  }

  async grantLocationPermission() {
    // Wait for location permission dialog to appear
    const locationDialog = this.page.getByRole('dialog', { name: 'Location for Weather Data' });
    await locationDialog.waitFor({ state: 'visible' });
    
    // Click the "Use My Current Location" button
    const useCurrentLocationButton = this.page.getByRole('button', { name: /use.*current.*location/i });
    await useCurrentLocationButton.click();
    
    // Wait for the dialog to close
    await locationDialog.waitFor({ state: 'hidden' });
    
    // Handle browser location permission dialog
    this.page.on('dialog', async dialog => {
      if (dialog.type() === 'beforeunload') {
        await dialog.accept();
      }
    });
  }

  async selectCareStyle(style: 'frequent' | 'balanced' | 'minimal') {
    const option = this.page.getByTestId(`care-style-${style}`);
    await option.click();
  }

  async selectSoilType(type: 'regular' | 'draining' | 'retaining') {
    const option = this.page.getByTestId(`soil-type-${type}`);
    await option.click();
  }

  async goToNextStep() {
    await this.nextButton.click({ timeout: TIMEOUTS.CLICK });
    await this.page.waitForTimeout(TIMEOUTS.ANIMATION); // Wait for step transition
  }

  async goToPreviousStep() {
    await this.backButton.click({ timeout: TIMEOUTS.CLICK });
    await this.page.waitForTimeout(TIMEOUTS.ANIMATION); // Wait for step transition
  }

  async applySchedule() {
    await this.applyButton.click();
    await this.wizardDialog.waitFor({ state: 'hidden' });
  }

  async expectStepVisible(stepNumber: number) {
    let stepTitle: Locator;
    switch (stepNumber) {
      case 1:
        stepTitle = this.page.locator('h3:has-text("How big is your")');
        break;
      case 2:
        stepTitle = this.page.locator('h3:has-text("Environmental Conditions")');
        break;
      case 3:
        stepTitle = this.page.locator('h3:has-text("Personal Preferences")');
        break;
      case 4:
        stepTitle = this.page.locator('h3:has-text("Your Personalized Schedule")');
        break;
      default:
        await FeatureErrorHandler.handleMissingFeature({
          featureName: `Smart Watering Step ${stepNumber}`,
          availability: FeatureAvailability.NOT_IMPLEMENTED,
          behavior: TestBehavior.THROW_ERROR,
          message: `Step ${stepNumber} is not implemented in the smart watering wizard`
        });
        return; // Exit early for unknown steps
    }
    await expect(stepTitle).toBeVisible();
  }

  async expectProgressBarValue(expectedValue: number) {
    // Check the text content that shows the percentage
    const progressText = this.page.getByText(`${expectedValue}% complete`);
    await expect(progressText).toBeVisible();
  }

  async expectRecommendedDays(expectedDays: number) {
    await expect(this.recommendedDays).toContainText(expectedDays.toString());
  }

  async expectConfidenceLevel(level: 'low' | 'medium' | 'high') {
    await expect(this.confidenceLevel).toContainText(level);
  }

  async expectWeatherDataVisible() {
    await expect(this.weatherDataSection).toBeVisible();
  }

  async expectWeatherDataHidden() {
    await expect(this.weatherDataSection).toBeHidden();
  }

  async expectAdjustmentReason(reason: string) {
    await expect(this.adjustmentReasons).toContainText(reason);
  }

  /**
   * Complete the entire smart watering wizard flow
   */
  async completeWizardFlow(factors: {
    plantSize: 'small' | 'medium' | 'large';
    lightLevel: 'low' | 'medium' | 'high';
    temperature: 'cool' | 'normal' | 'warm';
    humidity: 'dry' | 'normal' | 'humid';
    careStyle: 'frequent' | 'balanced' | 'minimal';
    soilType: 'regular' | 'draining' | 'retaining';
    useWeatherData?: boolean;
  }) {
    await this.completePlantSizeStep(factors.plantSize);
    await this.completeEnvironmentStep(factors);
    await this.completePreferencesStep(factors);
    await this.verifyResultsStep();
  }

  /**
   * Complete Step 1: Plant Size selection
   */
  private async completePlantSizeStep(plantSize: 'small' | 'medium' | 'large') {
    await this.selectPlantSize(plantSize);
    await this.goToNextStep();
  }

  /**
   * Complete Step 2: Environment configuration
   */
  private async completeEnvironmentStep(factors: {
    lightLevel: 'low' | 'medium' | 'high';
    temperature: 'cool' | 'normal' | 'warm';
    humidity: 'dry' | 'normal' | 'humid';
    useWeatherData?: boolean;
  }) {
    await this.configureEnvironmentSettings(factors);
    
    if (factors.useWeatherData) {
      await this.handleWeatherDataIntegration();
    }
    
    await this.goToNextStep();
  }

  /**
   * Configure basic environment settings
   */
  private async configureEnvironmentSettings(factors: {
    lightLevel: 'low' | 'medium' | 'high';
    temperature: 'cool' | 'normal' | 'warm';
    humidity: 'dry' | 'normal' | 'humid';
  }) {
    await this.setLightLevel(factors.lightLevel);
    await this.setTemperature(factors.temperature);
    await this.setHumidity(factors.humidity);
  }

  /**
   * Handle optional weather data integration
   */
  private async handleWeatherDataIntegration() {
    await this.toggleWeatherData();
    
    // Handle location dialog if it appears
    const locationDialog = this.page.getByRole('dialog', { name: 'Location for Weather Data' });
    if (await locationDialog.isVisible()) {
      await this.closeLocationDialog(locationDialog);
    }
  }

  /**
   * Close the location dialog for weather data
   */
  private async closeLocationDialog(locationDialog: Locator) {
    const closeButton = this.page.getByRole('button', { name: /close|cancel/i });
    await closeButton.click();
    await locationDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Complete Step 3: Care preferences
   */
  private async completePreferencesStep(factors: {
    careStyle: 'frequent' | 'balanced' | 'minimal';
    soilType: 'regular' | 'draining' | 'retaining';
  }) {
    await this.selectCareStyle(factors.careStyle);
    await this.selectSoilType(factors.soilType);
    await this.goToNextStep();
  }

  /**
   * Verify Step 4: Results are displayed
   */
  private async verifyResultsStep() {
    await this.expectStepVisible(4);
  }
}
