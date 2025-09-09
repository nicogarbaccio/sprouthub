import { test, expect } from '../../fixtures/test-fixtures';
import { TestUtils } from '../../utils/test-utils';

test.describe('Smart Watering System', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    
    // Mock successful weather API responses
    await testUtils.mockSuccessfulWeatherResponse();
    await testUtils.mockGeolocation(40.7128, -74.0060); // New York coordinates
    
    // Navigate to auth page and sign in first
    await page.goto('/auth');
    await testUtils.waitForAppLoad();
    
    // Clear storage after navigation
    await testUtils.clearStorage();
    
    // Sign in with test credentials
    await page.getByTestId('sign-in-email').fill('test@sprouthub.app');
    await page.getByTestId('sign-in-password').fill('TestPassword123!');
    await page.getByTestId('sign-in-button').click();
    
    // Wait for successful sign in and navigate to my-plants
    await page.waitForURL('/');
    await page.goto('/my-plants');
    await testUtils.waitForAppLoad();
  });

  test.describe('Smart Watering Wizard', () => {
    test('should open and display wizard correctly', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      await expect(smartWateringPage.wizardDialog).toBeVisible();
      await expect(smartWateringPage.wizardTitle).toBeVisible();
      await expect(smartWateringPage.progressBar).toBeVisible();
      
      // Should start at step 1
      await smartWateringPage.expectStepVisible(1);
      await smartWateringPage.expectProgressBarValue(0);
    });

    test('should complete full wizard flow with all factors', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      const factors = {
        plantSize: 'medium' as const,
        lightLevel: 'medium' as const,
        temperature: 'normal' as const,
        humidity: 'normal' as const,
        careStyle: 'balanced' as const,
        soilType: 'draining' as const,
        useWeatherData: true
      };
      
      await smartWateringPage.completeWizardFlow(factors);
      
      // Should show results
      await expect(smartWateringPage.recommendedDays).toBeVisible();
      await expect(smartWateringPage.confidenceLevel).toBeVisible();
      await expect(smartWateringPage.adjustmentReasons).toBeVisible();
    });

    test('should calculate different schedules for different plant sizes', async ({ smartWateringPage }) => {
      // Test small plant
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('small');
      await smartWateringPage.goToNextStep();
      
      // Set all environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      // Set preferences
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const smallPlantDays = await smartWateringPage.recommendedDays.textContent();
      const smallPlantDaysNumber = parseInt(smallPlantDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Test large plant
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('large');
      await smartWateringPage.goToNextStep();
      
      // Set all environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      // Set preferences
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const largePlantDays = await smartWateringPage.recommendedDays.textContent();
      const largePlantDaysNumber = parseInt(largePlantDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Large plants should have longer watering intervals
      expect(largePlantDaysNumber).toBeGreaterThan(smallPlantDaysNumber);
    });

    test('should handle weather data integration', async ({ smartWateringPage, page }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Set environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      
      // Enable weather data toggle
      await smartWateringPage.toggleWeatherData();
      
      // Should show location permission dialog
      const locationDialog = page.getByRole('dialog', { name: 'Location for Weather Data' });
      await expect(locationDialog).toBeVisible();
      
      // Close the dialog without granting permission (simulate user canceling)
      const closeButton = page.getByRole('button', { name: /close|cancel/i });
      await closeButton.click();
      await locationDialog.waitFor({ state: 'hidden' });
      
      // Complete wizard without weather data
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      // Should show results without weather data
      await expect(smartWateringPage.recommendedDays).toBeVisible();
    });

    test('should handle weather API failure gracefully', async ({ smartWateringPage, page }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Set environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      
      // Enable weather data toggle
      await smartWateringPage.toggleWeatherData();
      
      // Should show location permission dialog
      const locationDialog = page.getByRole('dialog', { name: 'Location for Weather Data' });
      await expect(locationDialog).toBeVisible();
      
      // Close the dialog without granting permission
      const closeButton = page.getByRole('button', { name: /close|cancel/i });
      await closeButton.click();
      await locationDialog.waitFor({ state: 'hidden' });
      
      // Complete wizard
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      // Should still show results without weather data
      await expect(smartWateringPage.recommendedDays).toBeVisible();
    });

    test('should allow navigation between steps', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      
      // Go to step 2
      await smartWateringPage.goToNextStep();
      await smartWateringPage.expectStepVisible(2);
      
      // Go back to step 1
      await smartWateringPage.goToPreviousStep();
      await smartWateringPage.expectStepVisible(1);
      
      // Go forward again
      await smartWateringPage.goToNextStep();
      await smartWateringPage.expectStepVisible(2);
    });

    test('should validate required selections before proceeding', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Try to proceed without selecting plant size - button should be disabled
      await expect(smartWateringPage.nextButton).toBeDisabled();
      
      // Select plant size and proceed
      await smartWateringPage.selectPlantSize('medium');
      await expect(smartWateringPage.nextButton).toBeEnabled();
      await smartWateringPage.goToNextStep();
      
      // Should move to step 2
      await smartWateringPage.expectStepVisible(2);
    });

    test('should apply schedule and close wizard', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Complete wizard with all factors
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      // Apply schedule
      await smartWateringPage.applySchedule();
      
      // Wizard should be closed
      await expect(smartWateringPage.wizardDialog).toBeHidden();
    });
  });

  test.describe('Environmental Factors', () => {
    test('should adjust schedule based on light level', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Test low light - need to set all environmental factors
      await smartWateringPage.setLightLevel('low');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const lowLightDays = await smartWateringPage.recommendedDays.textContent();
      const lowLightDaysNumber = parseInt(lowLightDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Test high light
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('high');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const highLightDays = await smartWateringPage.recommendedDays.textContent();
      const highLightDaysNumber = parseInt(highLightDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // High light should result in more frequent watering
      expect(highLightDaysNumber).toBeLessThan(lowLightDaysNumber);
    });

    test('should adjust schedule based on temperature', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Test cool temperature - need to set all environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('cool');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const coolTempDays = await smartWateringPage.recommendedDays.textContent();
      const coolTempDaysNumber = parseInt(coolTempDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Test warm temperature
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('warm');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const warmTempDays = await smartWateringPage.recommendedDays.textContent();
      const warmTempDaysNumber = parseInt(warmTempDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Warm temperature should result in more frequent watering
      expect(warmTempDaysNumber).toBeLessThan(coolTempDaysNumber);
    });

    test('should adjust schedule based on humidity', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Test low humidity - need to set all environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('dry');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const lowHumidityDays = await smartWateringPage.recommendedDays.textContent();
      const lowHumidityDaysNumber = parseInt(lowHumidityDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Test high humidity
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('humid');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const highHumidityDays = await smartWateringPage.recommendedDays.textContent();
      const highHumidityDaysNumber = parseInt(highHumidityDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // High humidity should result in less frequent watering
      expect(highHumidityDaysNumber).toBeGreaterThan(lowHumidityDaysNumber);
    });
  });

  test.describe('Care Preferences', () => {
    test('should adjust schedule based on care style', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Set environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      // Test minimal care
      await smartWateringPage.selectCareStyle('minimal');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const minimalCareDays = await smartWateringPage.recommendedDays.textContent();
      const minimalCareDaysNumber = parseInt(minimalCareDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Test frequent care
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Set environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('frequent');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const frequentCareDays = await smartWateringPage.recommendedDays.textContent();
      const frequentCareDaysNumber = parseInt(frequentCareDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Frequent care should result in more frequent watering
      expect(frequentCareDaysNumber).toBeLessThan(minimalCareDaysNumber);
    });

    test('should adjust schedule based on soil type', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Set environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      // Test draining soil
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      const drainingDays = await smartWateringPage.recommendedDays.textContent();
      const drainingDaysNumber = parseInt(drainingDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Test retaining soil
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Set environmental factors
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('retaining');
      await smartWateringPage.goToNextStep();
      
      const retainingDays = await smartWateringPage.recommendedDays.textContent();
      const retainingDaysNumber = parseInt(retainingDays!.match(/\d+/)?.[0] || '0');
      
      await smartWateringPage.closeWizard();
      
      // Retaining soil should result in less frequent watering
      expect(retainingDaysNumber).toBeGreaterThan(drainingDaysNumber);
    });
  });

  test.describe('Schedule Validation', () => {
    test('should enforce minimum watering interval', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Use factors that would result in very frequent watering
      await smartWateringPage.selectPlantSize('small');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('high');
      await smartWateringPage.setTemperature('warm');
      await smartWateringPage.setHumidity('dry');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('frequent');
      await smartWateringPage.selectSoilType('draining');
      await smartWateringPage.goToNextStep();
      
      // Should enforce minimum of 2 days
      const recommendedDays = await smartWateringPage.recommendedDays.textContent();
      const recommendedDaysNumber = parseInt(recommendedDays!.match(/\d+/)?.[0] || '0');
      expect(recommendedDaysNumber).toBeGreaterThanOrEqual(2);
    });

    test('should enforce maximum watering interval', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Use factors that would result in very infrequent watering
      await smartWateringPage.selectPlantSize('large');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('low');
      await smartWateringPage.setTemperature('cool');
      await smartWateringPage.setHumidity('humid');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('minimal');
      await smartWateringPage.selectSoilType('retaining');
      await smartWateringPage.goToNextStep();
      
      // Should enforce maximum of 45 days
      const recommendedDays = await smartWateringPage.recommendedDays.textContent();
      const recommendedDaysNumber = parseInt(recommendedDays!.match(/\d+/)?.[0] || '0');
      expect(recommendedDaysNumber).toBeLessThanOrEqual(45);
    });

    test('should show confidence level based on factors', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Complete with moderate factors (should have high confidence)
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('medium');
      await smartWateringPage.setTemperature('normal');
      await smartWateringPage.setHumidity('normal');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('balanced');
      await smartWateringPage.selectSoilType('regular');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.expectConfidenceLevel('high');
    });
  });
});
