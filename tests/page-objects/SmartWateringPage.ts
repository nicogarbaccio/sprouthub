import { Page, Locator, expect } from '@playwright/test';

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
  readonly lightLevelSlider: Locator;
  readonly temperatureSlider: Locator;
  readonly humiditySlider: Locator;
  readonly weatherToggle: Locator;
  readonly locationPermissionButton: Locator;

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
    this.wizardDialog = page.locator('[role="dialog"]');
    this.wizardTitle = page.locator('h2', { hasText: 'Smart Watering Schedule' });
    this.progressBar = page.locator('[role="progressbar"]');
    this.stepIndicators = page.locator('[data-testid="step-indicator"]');
    this.nextButton = page.getByRole('button', { name: /next|continue/i });
    this.backButton = page.getByRole('button', { name: /back|previous/i });
    this.applyButton = page.getByRole('button', { name: /apply|save/i });
    this.closeButton = page.getByRole('button', { name: /close|cancel/i });

    // Step 1 - Plant Size
    this.plantSizeOptions = page.locator('[data-testid="plant-size-option"]');
    this.smallPlantOption = page.getByTestId('plant-size-small');
    this.mediumPlantOption = page.getByTestId('plant-size-medium');
    this.largePlantOption = page.getByTestId('plant-size-large');

    // Step 2 - Environment
    this.lightLevelSlider = page.getByTestId('light-level-slider');
    this.temperatureSlider = page.getByTestId('temperature-slider');
    this.humiditySlider = page.getByTestId('humidity-slider');
    this.weatherToggle = page.getByTestId('weather-data-toggle');
    this.locationPermissionButton = page.getByTestId('location-permission-button');

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
    // This assumes there's a button to open the smart watering wizard
    const openButton = this.page.getByTestId('open-smart-watering-wizard');
    await openButton.click();
    await this.wizardDialog.waitFor({ state: 'visible' });
  }

  async closeWizard() {
    await this.closeButton.click();
    await this.wizardDialog.waitFor({ state: 'hidden' });
  }

  async selectPlantSize(size: 'small' | 'medium' | 'large') {
    const option = this.page.getByTestId(`plant-size-${size}`);
    await option.click();
    await this.page.waitForTimeout(300); // Wait for selection animation
  }

  async setLightLevel(level: 'low' | 'medium' | 'high') {
    const slider = this.lightLevelSlider;
    const value = level === 'low' ? 0 : level === 'medium' ? 50 : 100;
    await slider.fill(value.toString());
  }

  async setTemperature(temp: 'cool' | 'moderate' | 'warm') {
    const slider = this.temperatureSlider;
    const value = temp === 'cool' ? 0 : temp === 'moderate' ? 50 : 100;
    await slider.fill(value.toString());
  }

  async setHumidity(humidity: 'low' | 'medium' | 'high') {
    const slider = this.humiditySlider;
    const value = humidity === 'low' ? 0 : humidity === 'medium' ? 50 : 100;
    await slider.fill(value.toString());
  }

  async toggleWeatherData() {
    await this.weatherToggle.click();
  }

  async grantLocationPermission() {
    await this.locationPermissionButton.click();
    
    // Handle browser location permission dialog
    this.page.on('dialog', async dialog => {
      if (dialog.type() === 'beforeunload') {
        await dialog.accept();
      }
    });
  }

  async selectCareStyle(style: 'minimal' | 'moderate' | 'intensive') {
    const option = this.page.getByTestId(`care-style-${style}`);
    await option.click();
  }

  async selectSoilType(type: 'well-draining' | 'moisture-retaining' | 'fast-draining') {
    const option = this.page.getByTestId(`soil-type-${type}`);
    await option.click();
  }

  async goToNextStep() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500); // Wait for step transition
  }

  async goToPreviousStep() {
    await this.backButton.click();
    await this.page.waitForTimeout(500); // Wait for step transition
  }

  async applySchedule() {
    await this.applyButton.click();
    await this.wizardDialog.waitFor({ state: 'hidden' });
  }

  async expectStepVisible(stepNumber: number) {
    const stepTitle = this.page.locator(`h3:has-text("Step ${stepNumber}")`);
    await expect(stepTitle).toBeVisible();
  }

  async expectProgressBarValue(expectedValue: number) {
    const progressValue = this.progressBar.getAttribute('aria-valuenow');
    await expect(progressValue).toBe(expectedValue.toString());
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

  async completeWizardFlow(factors: {
    plantSize: 'small' | 'medium' | 'large';
    lightLevel: 'low' | 'medium' | 'high';
    temperature: 'cool' | 'moderate' | 'warm';
    humidity: 'low' | 'medium' | 'high';
    careStyle: 'minimal' | 'moderate' | 'intensive';
    soilType: 'well-draining' | 'moisture-retaining' | 'fast-draining';
    useWeatherData?: boolean;
  }) {
    // Step 1: Plant Size
    await this.selectPlantSize(factors.plantSize);
    await this.goToNextStep();

    // Step 2: Environment
    await this.setLightLevel(factors.lightLevel);
    await this.setTemperature(factors.temperature);
    await this.setHumidity(factors.humidity);
    
    if (factors.useWeatherData) {
      await this.toggleWeatherData();
      await this.grantLocationPermission();
    }
    
    await this.goToNextStep();

    // Step 3: Preferences
    await this.selectCareStyle(factors.careStyle);
    await this.selectSoilType(factors.soilType);
    await this.goToNextStep();

    // Step 4: Results - should be automatically calculated
    await this.expectStepVisible(4);
  }
}
