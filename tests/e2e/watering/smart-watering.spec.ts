import { test, expect } from '../../fixtures/test-fixtures';
import { TestUtils } from '../../utils/test-utils';

test.describe('Smart Watering System', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.clearStorage();
    
    // Mock successful weather API responses
    await testUtils.mockSuccessfulWeatherResponse();
    await testUtils.mockGeolocation(40.7128, -74.0060); // New York coordinates
    
    // Navigate to a page where smart watering wizard can be opened
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
        temperature: 'moderate' as const,
        humidity: 'medium' as const,
        careStyle: 'moderate' as const,
        soilType: 'well-draining' as const,
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
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const smallPlantDays = await smartWateringPage.recommendedDays.textContent();
      
      await smartWateringPage.closeWizard();
      
      // Test large plant
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('large');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const largePlantDays = await smartWateringPage.recommendedDays.textContent();
      
      // Large plants should have longer watering intervals
      expect(parseInt(largePlantDays!)).toBeGreaterThan(parseInt(smallPlantDays!));
    });

    test('should handle weather data integration', async ({ smartWateringPage, page }) => {
      await smartWateringPage.openWizard();
      
      // Go to environment step
      await smartWateringPage.goToNextStep();
      
      // Enable weather data
      await smartWateringPage.toggleWeatherData();
      
      // Should show location permission dialog
      await expect(smartWateringPage.locationPermissionButton).toBeVisible();
      
      // Grant permission
      await smartWateringPage.grantLocationPermission();
      
      // Complete wizard
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      // Should show weather data in results
      await smartWateringPage.expectWeatherDataVisible();
    });

    test('should handle weather API failure gracefully', async ({ smartWateringPage, page }) => {
      // Mock failed weather response
      await testUtils.mockFailedWeatherResponse();
      
      await smartWateringPage.openWizard();
      await smartWateringPage.goToNextStep();
      
      // Enable weather data
      await smartWateringPage.toggleWeatherData();
      await smartWateringPage.grantLocationPermission();
      
      // Complete wizard
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      // Should still show results without weather data
      await expect(smartWateringPage.recommendedDays).toBeVisible();
      await smartWateringPage.expectWeatherDataHidden();
    });

    test('should allow navigation between steps', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
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
      
      // Try to proceed without selecting plant size
      await smartWateringPage.goToNextStep();
      
      // Should stay on step 1
      await smartWateringPage.expectStepVisible(1);
      
      // Select plant size and proceed
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Should move to step 2
      await smartWateringPage.expectStepVisible(2);
    });

    test('should apply schedule and close wizard', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Complete wizard quickly
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
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
      
      // Test low light
      await smartWateringPage.setLightLevel('low');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const lowLightDays = await smartWateringPage.recommendedDays.textContent();
      
      await smartWateringPage.closeWizard();
      
      // Test high light
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('high');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const highLightDays = await smartWateringPage.recommendedDays.textContent();
      
      // High light should result in more frequent watering
      expect(parseInt(highLightDays!)).toBeLessThan(parseInt(lowLightDays!));
    });

    test('should adjust schedule based on temperature', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Test cool temperature
      await smartWateringPage.setTemperature('cool');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const coolTempDays = await smartWateringPage.recommendedDays.textContent();
      
      await smartWateringPage.closeWizard();
      
      // Test warm temperature
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setTemperature('warm');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const warmTempDays = await smartWateringPage.recommendedDays.textContent();
      
      // Warm temperature should result in more frequent watering
      expect(parseInt(warmTempDays!)).toBeLessThan(parseInt(coolTempDays!));
    });

    test('should adjust schedule based on humidity', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      // Test low humidity
      await smartWateringPage.setHumidity('low');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const lowHumidityDays = await smartWateringPage.recommendedDays.textContent();
      
      await smartWateringPage.closeWizard();
      
      // Test high humidity
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setHumidity('high');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      const highHumidityDays = await smartWateringPage.recommendedDays.textContent();
      
      // High humidity should result in less frequent watering
      expect(parseInt(highHumidityDays!)).toBeGreaterThan(parseInt(lowHumidityDays!));
    });
  });

  test.describe('Care Preferences', () => {
    test('should adjust schedule based on care style', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      // Test minimal care
      await smartWateringPage.selectCareStyle('minimal');
      await smartWateringPage.goToNextStep();
      
      const minimalCareDays = await smartWateringPage.recommendedDays.textContent();
      
      await smartWateringPage.closeWizard();
      
      // Test intensive care
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('intensive');
      await smartWateringPage.goToNextStep();
      
      const intensiveCareDays = await smartWateringPage.recommendedDays.textContent();
      
      // Intensive care should result in more frequent watering
      expect(parseInt(intensiveCareDays!)).toBeLessThan(parseInt(minimalCareDays!));
    });

    test('should adjust schedule based on soil type', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      // Test well-draining soil
      await smartWateringPage.selectSoilType('well-draining');
      await smartWateringPage.goToNextStep();
      
      const wellDrainingDays = await smartWateringPage.recommendedDays.textContent();
      
      await smartWateringPage.closeWizard();
      
      // Test moisture-retaining soil
      await smartWateringPage.openWizard();
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectSoilType('moisture-retaining');
      await smartWateringPage.goToNextStep();
      
      const moistureRetainingDays = await smartWateringPage.recommendedDays.textContent();
      
      // Moisture-retaining soil should result in less frequent watering
      expect(parseInt(moistureRetainingDays!)).toBeGreaterThan(parseInt(wellDrainingDays!));
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
      await smartWateringPage.setHumidity('low');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('intensive');
      await smartWateringPage.selectSoilType('fast-draining');
      await smartWateringPage.goToNextStep();
      
      // Should enforce minimum of 2 days
      const recommendedDays = await smartWateringPage.recommendedDays.textContent();
      expect(parseInt(recommendedDays!)).toBeGreaterThanOrEqual(2);
    });

    test('should enforce maximum watering interval', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Use factors that would result in very infrequent watering
      await smartWateringPage.selectPlantSize('large');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.setLightLevel('low');
      await smartWateringPage.setTemperature('cool');
      await smartWateringPage.setHumidity('high');
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.selectCareStyle('minimal');
      await smartWateringPage.selectSoilType('moisture-retaining');
      await smartWateringPage.goToNextStep();
      
      // Should enforce maximum of 45 days
      const recommendedDays = await smartWateringPage.recommendedDays.textContent();
      expect(parseInt(recommendedDays!)).toBeLessThanOrEqual(45);
    });

    test('should show confidence level based on factors', async ({ smartWateringPage }) => {
      await smartWateringPage.openWizard();
      
      // Complete with moderate factors (should have high confidence)
      await smartWateringPage.selectPlantSize('medium');
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      await smartWateringPage.goToNextStep();
      
      await smartWateringPage.expectConfidenceLevel('high');
    });
  });
});
